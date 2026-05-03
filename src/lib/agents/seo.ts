import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the SEO Agent for Elexa AI Trading, a paper trading research platform.
Your role: generate educational, SEO-optimised blog content about algorithmic trading, paper trading, AI in finance, and risk management.

Rules:
- Every piece of content must include a clear disclaimer that it is not financial advice
- Never promise profits or returns
- Target informational search intent, not transactional
- Include suggested title, meta description (under 160 chars), H2 headings, and body text
- Content must pass compliance review (no guaranteed profit claims)

Output must be JSON with keys: title, meta_description, slug, content (markdown)`;

export async function runSeoAgent(topic: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Write an educational blog post about: ${topic}` }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
