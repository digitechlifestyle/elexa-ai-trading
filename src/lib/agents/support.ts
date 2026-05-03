import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Support Agent for Elexa AI Trading, a paper trading research platform.
Your role: answer user questions about the platform clearly and helpfully.

Rules:
- Only answer questions about how the Elexa platform works
- If asked for financial advice or investment recommendations, politely decline and direct users to a licensed financial advisor
- If asked about live trading, explain that it is not currently available and paper trading is the only mode
- Be concise and helpful
- Never make claims about trading profitability`;

export async function runSupportAgent(question: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: question }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
