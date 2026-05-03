import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FORBIDDEN_PHRASES = [
  "guaranteed profit",
  "guaranteed return",
  "risk-free",
  "certain to",
  "will make money",
  "no risk",
  "100% accurate",
  "always profitable",
];

const SYSTEM = `You are the Compliance Agent for Elexa AI Trading, a paper trading research platform.
Your role: review text for regulatory compliance issues related to financial promotions.

Flag any content that:
- Promises or implies guaranteed profits or returns
- Suggests trading is risk-free
- Makes performance claims without disclaimers
- Could be construed as unlicensed financial advice
- Contains misleading statements about AI trading accuracy

Output must be JSON with keys:
- compliant (boolean)
- issues (string[]) — list of specific phrases or sentences that are problematic
- suggested_fix (string) — rewritten compliant version, or "" if compliant`;

export async function runComplianceAgent(content: string): Promise<string> {
  // Fast local check first
  const lower = content.toLowerCase();
  const localFlags = FORBIDDEN_PHRASES.filter((p) => lower.includes(p));
  if (localFlags.length > 0) {
    return JSON.stringify({
      compliant: false,
      issues: localFlags.map((p) => `Contains forbidden phrase: "${p}"`),
      suggested_fix: "",
    });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
