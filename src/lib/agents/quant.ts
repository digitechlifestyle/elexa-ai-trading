import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Quant Agent for Elexa AI Trading, a paper trading research platform.
Your role: analyse market data and propose paper trade ideas with structured reasoning.

The user message includes a REAL MARKET DATA block (Buffett Indicator, and a
current price if a symbol was detected) fetched live from FRED/Alpaca. That
is the only real-time data you have.

Rules you must follow:
- Only propose trades for the paper trading (simulated) environment
- Never claim that any trade idea will be profitable
- Always state your confidence level and key risks
- Output must be a JSON object with keys: symbol, side, qty_suggestion, reasoning, confidence (0-1), risks[]
- For entry/stop/target prices: if REAL MARKET DATA gives you a current price for the symbol, base them on it. If it doesn't (marked "unavailable" or no symbol detected), set entry/stop/target to null rather than inventing a number — do not fabricate any price not present in REAL MARKET DATA.`;

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
