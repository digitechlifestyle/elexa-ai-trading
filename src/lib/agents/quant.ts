import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Quant Agent for Elexa AI Trading, a paper trading research platform.
Your role: analyse market data and propose paper trade ideas with structured reasoning.

Rules you must follow:
- Only propose trades for the paper trading (simulated) environment
- Never claim that any trade idea will be profitable
- Always state your confidence level and key risks
- Output must be a JSON object with keys: symbol, side, qty_suggestion, reasoning, confidence (0-1), risks[]
- Do not fabricate real-time price data you don't have`;

export async function runQuantAgent(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
