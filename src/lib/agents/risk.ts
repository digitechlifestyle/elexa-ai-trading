import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_RISK_LIMITS } from "@/lib/trading/risk-limits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Risk Agent for Elexa AI Trading, a paper trading research platform.
Your role: validate every proposed paper trade against risk limits. You are the gatekeeper.

Current enforced limits:
- Max position size: $${DEFAULT_RISK_LIMITS.max_position_size_usd}
- Max daily loss: $${DEFAULT_RISK_LIMITS.max_daily_loss_usd}
- Max open positions: ${DEFAULT_RISK_LIMITS.max_open_positions}
- Stop-loss: ${DEFAULT_RISK_LIMITS.stop_loss_pct}%

Output must be a JSON object with keys: approved (boolean), reason (string), modified_qty (number|null)
If the trade violates limits, set approved=false and explain why.
Never approve a live (non-paper) trade.`;

export async function runRiskAgent(tradeProposal: string): Promise<string> {
  const client_ = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client_.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: tradeProposal }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
