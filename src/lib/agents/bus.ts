import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AgentName =
  | "ceo"
  | "quant"
  | "risk"
  | "compliance"
  | "seo"
  | "support";

export type MessageKind =
  | "request"
  | "response"
  | "proposal"
  | "validation"
  | "flag"
  | "delegation"
  | "briefing";

export interface AgentMessage {
  id?: string;
  from: AgentName | "user";
  to: AgentName | "user" | "broadcast";
  kind: MessageKind;
  payload: unknown;
  correlation_id: string;
  parent_id?: string | null;
  user_id: string;
  created_at?: string;
}

export interface AgentDefinition {
  name: AgentName;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  // Which other agents this agent is allowed to message.
  // Enforced at the bus level so a misbehaving agent can't escape its lane.
  canMessage: AgentName[];
}

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

export class AgentBus {
  private anthropic: Anthropic;
  private supabase: SupabaseClient;
  private userId: string;
  private agents: Map<AgentName, AgentDefinition>;
  private correlationId: string;

  constructor(
    supabase: SupabaseClient,
    userId: string,
    agents: AgentDefinition[],
    correlationId: string
  ) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.supabase = supabase;
    this.userId = userId;
    this.correlationId = correlationId;
    this.agents = new Map(agents.map((a) => [a.name, a]));
  }

  /**
   * Send a message from one agent to another and wait for a response.
   * Persists every message to agent_messages for full audit trail.
   */
  async send(message: Omit<AgentMessage, "user_id" | "correlation_id">): Promise<AgentMessage> {
    // Authorisation: enforce which agents can talk to whom
    if (message.from !== "user" && message.from in this.agents) {
      const fromAgent = this.agents.get(message.from as AgentName);
      if (
        fromAgent &&
        message.to !== "user" &&
        message.to !== "broadcast" &&
        !fromAgent.canMessage.includes(message.to as AgentName)
      ) {
        throw new Error(
          `Authorisation denied: ${message.from} cannot message ${message.to}`
        );
      }
    }

    const fullMessage: AgentMessage = {
      ...message,
      user_id: this.userId,
      correlation_id: this.correlationId,
    };

    // Persist the message
    const { data: stored } = await this.supabase
      .from("agent_messages")
      .insert(fullMessage)
      .select()
      .single();

    return stored ?? fullMessage;
  }

  /**
   * Invoke an agent with a request. The agent generates a response,
   * which is automatically persisted as a response message.
   */
  async invoke(
    target: AgentName,
    request: string,
    parentMessageId?: string
  ): Promise<{ output: string; messageId: string | undefined }> {
    const agent = this.agents.get(target);
    if (!agent) {
      throw new Error(`Unknown agent: ${target}`);
    }

    // Persist the request
    const requestMsg = await this.send({
      from: "user",
      to: target,
      kind: "request",
      payload: { content: request },
      parent_id: parentMessageId ?? null,
    });

    // Build context: include any prior messages in this correlation
    const { data: history } = await this.supabase
      .from("agent_messages")
      .select("from, to, kind, payload")
      .eq("correlation_id", this.correlationId)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true })
      .limit(20);

    const contextSummary = (history ?? [])
      .filter((m) => m.from !== "user" || (m.payload as { content?: string })?.content)
      .map((m) => {
        const content =
          typeof m.payload === "object" && m.payload && "content" in m.payload
            ? (m.payload as { content: string }).content
            : JSON.stringify(m.payload);
        return `[${m.from} → ${m.to} | ${m.kind}]: ${content?.slice(0, 500)}`;
      })
      .join("\n\n");

    const fullPrompt = contextSummary
      ? `Recent inter-agent activity:\n${contextSummary}\n\n---\n\nCurrent request:\n${request}`
      : request;

    // Call Claude
    let output: string;
    try {
      const response = await this.anthropic.messages.create({
        model: agent.model ?? ANTHROPIC_MODEL,
        max_tokens: agent.maxTokens ?? 2048,
        system: agent.systemPrompt,
        messages: [{ role: "user", content: fullPrompt }],
      });

      const block = response.content[0];
      output = block?.type === "text" ? block.text : "";
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Agent invocation failed";
      // Persist the failure
      await this.send({
        from: target,
        to: "user",
        kind: "response",
        payload: { error: errMsg, failed: true },
        parent_id: requestMsg.id ?? null,
      });
      throw err;
    }

    // Persist the response
    const responseMsg = await this.send({
      from: target,
      to: "user",
      kind: "response",
      payload: { content: output },
      parent_id: requestMsg.id ?? null,
    });

    return { output, messageId: responseMsg.id };
  }

  /**
   * Higher-level workflow: agent A delegates a task to agent B and gets the result.
   * Records the full delegation chain.
   */
  async delegate(
    from: AgentName,
    to: AgentName,
    task: string,
    parentMessageId?: string
  ): Promise<{ output: string; messageId: string | undefined }> {
    // Record the delegation intent
    const delegationMsg = await this.send({
      from,
      to,
      kind: "delegation",
      payload: { task },
      parent_id: parentMessageId ?? null,
    });

    // Invoke target agent (response is auto-persisted)
    return this.invoke(to, task, delegationMsg.id);
  }

  /**
   * Get the full conversation history for this correlation.
   * Useful for debugging and showing audit trails to the user.
   */
  async history(): Promise<AgentMessage[]> {
    const { data } = await this.supabase
      .from("agent_messages")
      .select("*")
      .eq("correlation_id", this.correlationId)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true });
    return (data ?? []) as AgentMessage[];
  }
}
