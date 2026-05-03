import { createClient } from "@/lib/supabase/server";
import { AgentBus, type AgentName } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const VALID_AGENTS: AgentName[] = [
  "ceo",
  "quant",
  "risk",
  "compliance",
  "seo",
  "support",
];

export const POST = withApi(async function POST(request: NextRequest, { requestId }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.agent !== "string" || typeof body.input !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const agent = body.agent as AgentName;
  if (!VALID_AGENTS.includes(agent)) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
  }

  // Each invocation gets its own correlation id so we can trace every
  // message in the resulting conversation.
  const correlationId = randomUUID();
  const bus = new AgentBus(supabase, user.id, ALL_AGENTS, correlationId);

  // Create run record (legacy table — keep for backwards compat with admin panel)
  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      user_id: user.id,
      agent,
      input: body.input,
      status: "running",
    })
    .select()
    .single();

  let output: string;
  let status: "completed" | "failed";

  try {
    // Workflow orchestration — agents that have downstream collaborators
    // automatically chain to them.
    if (agent === "quant") {
      // Quant proposes → Risk validates → return both
      const quantResult = await bus.invoke("quant", body.input);
      const riskResult = await bus.delegate(
        "quant",
        "risk",
        `Validate this trade proposal:\n\n${quantResult.output}`
      );
      output = `## Quant Agent Proposal\n\n${quantResult.output}\n\n---\n\n## Risk Agent Validation\n\n${riskResult.output}`;
    } else if (agent === "seo") {
      // SEO drafts → Compliance reviews → return both
      const seoResult = await bus.invoke("seo", body.input);
      const complianceResult = await bus.delegate(
        "seo",
        "compliance",
        `Review this draft for compliance:\n\n${seoResult.output}`
      );
      output = `## SEO Agent Draft\n\n${seoResult.output}\n\n---\n\n## Compliance Review\n\n${complianceResult.output}`;
    } else if (agent === "ceo") {
      // CEO synthesises — for the demo path, just produce a briefing
      const result = await bus.invoke("ceo", body.input);
      output = result.output;
    } else {
      // Risk, Compliance, Support — direct invoke
      const result = await bus.invoke(agent, body.input);
      output = result.output;
    }
    status = "completed";
    log.info("agent.run.completed", {
      request_id: requestId,
      user_id: user.id,
      agent,
      correlation_id: correlationId,
    });
  } catch (err) {
    output = err instanceof Error ? err.message : "Agent failed";
    status = "failed";
    log.error("agent.run.failed", {
      request_id: requestId,
      user_id: user.id,
      agent,
      message: output,
    });
  }

  // Update run record
  if (run) {
    await supabase
      .from("agent_runs")
      .update({ output, status })
      .eq("id", run.id);
  }

  return NextResponse.json(
    {
      run: run ? { ...run, output, status } : { output, status },
      correlation_id: correlationId,
    },
    { status: 200 }
  );
});
