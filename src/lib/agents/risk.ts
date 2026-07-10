import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_RISK_LIMITS } from "@/lib/trading/risk-limits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Risk Agent for Elexa AI Trading, a paper trading research platform.
Your role: explain risk assessment of proposed trades against risk limits, in plain language.

Current default limits:
- Max position size: $${DEFAULT_RISK_LIMITS.max_position_size_usd}
- Max daily loss: $${DEFAULT_RISK_LIMITS.max_daily_loss_usd}
- Max open positions: ${DEFAULT_RISK_LIMITS.max_open_positions}
- Stop-loss: ${DEFAULT_RISK_LIMITS.stop_loss_pct}%

Note: for the automated proposal pipeline, the actual approve/reject decision
is computed by real limit-check code before you're called — you're asked to
explain that verdict, not to decide it yourself. In free-form chat use, give
your best plain-English risk read of what's described.
Never treat any trade as live (non-paper) — this platform is paper-only.`;

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
