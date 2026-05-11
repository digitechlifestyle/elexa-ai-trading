import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export interface TradePlan {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  entry: number | null;
  stop: number | null;
  target: number | null;
  confidence: "low" | "medium" | "high" | null;
  reasoning: string;
}

const QUANT_PROPOSAL_PROMPT = `Based on the user's request below, propose ONE concrete paper trade.

Reply with a valid JSON object only, no surrounding text, with these exact fields:
{
  "symbol": "ticker (e.g. AAPL, BTC, GLD)",
  "side": "buy" or "sell",
  "qty": number (positive),
  "entry": number (suggested entry price) or null,
  "stop": number (stop-loss price) or null,
  "target": number (profit target price) or null,
  "confidence": "low", "medium", or "high",
  "reasoning": "2-3 sentence rationale"
}

User request:
`;

function tryParseJson(text: string): TradePlan | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    // Find JSON object boundary
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (
      typeof obj.symbol === "string" &&
      (obj.side === "buy" || obj.side === "sell") &&
      typeof obj.qty === "number"
    ) {
      return {
        symbol: obj.symbol.toUpperCase(),
        side: obj.side,
        qty: Number(obj.qty),
        entry: typeof obj.entry === "number" ? obj.entry : null,
        stop: typeof obj.stop === "number" ? obj.stop : null,
        target: typeof obj.target === "number" ? obj.target : null,
        confidence: ["low", "medium", "high"].includes(obj.confidence)
          ? obj.confidence
          : null,
        reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `agents:${user.id}`,
    ...RATE_LIMITS.agents,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limited. Try again shortly." },
      { status: 429, headers: { "retry-after": "300" } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.input !== "string" || !body.input.trim()) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const correlationId = randomUUID();
  const bus = new AgentBus(supabase, user.id, ALL_AGENTS, correlationId);

  // 1) Quant agent — proposal in JSON
  const quant = await bus.invoke("quant", QUANT_PROPOSAL_PROMPT + body.input);
  const plan = tryParseJson(quant.output);

  if (!plan) {
    return NextResponse.json({
      correlation_id: correlationId,
      quant_output: quant.output,
      plan: null,
      risk_output: null,
      error_parse: "Quant Agent did not return valid JSON. Try a more specific prompt.",
    });
  }

  // 2) Risk agent — validate the parsed plan
  const riskPrompt = `Validate this trade proposal against risk limits (max position size $5000, daily loss cap $500, max 10 open positions, mandatory stop-loss 5%):

Proposal:
- Symbol: ${plan.symbol}
- Side: ${plan.side}
- Qty: ${plan.qty}
- Entry: ${plan.entry}
- Stop: ${plan.stop}
- Target: ${plan.target}
- Confidence: ${plan.confidence}
- Reasoning: ${plan.reasoning}

Respond starting with APPROVED or REJECTED, then reason and any suggested adjustment.`;

  const risk = await bus.delegate("quant", "risk", riskPrompt);
  const riskApproved = /^APPROVED/i.test(risk.output.trim());

  return NextResponse.json({
    correlation_id: correlationId,
    plan,
    quant_output: quant.output,
    risk_output: risk.output,
    risk_approved: riskApproved,
  });
});
