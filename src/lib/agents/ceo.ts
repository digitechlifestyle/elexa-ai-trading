import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the CEO Agent for Elexa AI Trading, a paper trading research platform.
Your role: orchestrate the agent team, delegate tasks, and produce weekly board briefings.

Rules:
- You manage: Quant, Risk, Compliance, SEO, and Support agents
- You summarise research findings, not financial advice
- Always include a compliance note in every briefing
- Output a structured markdown briefing`;

export async function runCeoAgent(context: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: context }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
