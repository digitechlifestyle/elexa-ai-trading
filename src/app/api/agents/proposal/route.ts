import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getPlanForUser } from "@/lib/billing/plans";
import { buildMarketContext } from "@/lib/agents/market-context";
import { AlpacaExchange } from "@/lib/exchanges/alpaca";
import {
  validateOrder,
  checkDailyLoss,
  checkOpenPositions,
  isValidSymbolFormat,
} from "@/lib/trading/risk-limits";
import { getRiskLimitsForUser } from "@/lib/trading/user-limits";
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

  // Gate Auto-Trade behind Pro plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const userPlan = getPlanForUser(user, profile?.role ?? null);
  if (!userPlan.limits.auto_trade) {
    return NextResponse.json(
      {
        error: "Auto-Trade is a Pro feature.",
        upgrade_url: "/pricing",
        plan: userPlan.id,
      },
      { status: 402 }
    );
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

  // 1) Real market data — grounds the Quant Agent instead of letting it
  // invent prices. See lib/agents/market-context.ts.
  const market = await buildMarketContext(body.input);
  const quantPrompt = `REAL MARKET DATA (fetched live — use only this for any price):
${market.contextBlock}

${QUANT_PROPOSAL_PROMPT}
User request:
${body.input}`;

  // 2) Quant agent — proposal in JSON
  const quant = await bus.invoke("quant", quantPrompt);
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

  // 3) Risk check — REAL validation against the same limit-check functions
  // that gate actual order placement, not an LLM parsing "APPROVED"/"REJECTED"
  // out of English text. The Risk Agent LLM call below is kept only for a
  // human-readable explanation; it does not decide anything.
  const limits = getRiskLimitsForUser(user);
  let realPrice: number | null = market.symbol === plan.symbol ? market.price : null;
  if (realPrice == null && isValidSymbolFormat(plan.symbol)) {
    try {
      const exchange = new AlpacaExchange({
        name: "alpaca",
        api_key: process.env.ALPACA_API_KEY || "",
        api_secret: process.env.ALPACA_API_SECRET || "",
        base_url: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
      });
      realPrice = await exchange.getAssetPrice(plan.symbol);
    } catch {
      realPrice = null;
    }
  }

  let realCheck: { allowed: boolean; reason: string; code: string };
  if (!isValidSymbolFormat(plan.symbol)) {
    realCheck = { allowed: false, reason: "Invalid symbol format", code: "SYMBOL_INVALID" };
  } else if (realPrice == null) {
    realCheck = { allowed: false, reason: "Could not fetch a real current price to validate against", code: "PRICE_UNAVAILABLE" };
  } else {
    const orderCheck = validateOrder(plan.symbol, plan.qty, realPrice, limits);
    if (!orderCheck.valid) {
      realCheck = { allowed: false, reason: orderCheck.reason, code: orderCheck.code };
    } else {
      const { count: openCount } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "filled")
        .eq("is_paper", true);
      const positionsCheck = checkOpenPositions(openCount ?? 0, limits);
      if (!positionsCheck.allowed) {
        realCheck = { allowed: false, reason: positionsCheck.reason, code: positionsCheck.code };
      } else {
        const today = new Date().toISOString().split("T")[0];
        const { data: todayTrades } = await supabase
          .from("trades")
          .select("filled_price, qty, side")
          .eq("user_id", user.id)
          .eq("status", "filled")
          .gte("created_at", `${today}T00:00:00.000Z`);
        const dailyPnl = (todayTrades ?? []).reduce((acc, t) => {
          const val = (t.filled_price ?? 0) * t.qty;
          return acc + (t.side === "sell" ? val : -val);
        }, 0);
        const lossCheck = checkDailyLoss(dailyPnl, limits);
        realCheck = lossCheck.allowed
          ? { allowed: true, reason: "Within risk limits", code: "OK" }
          : { allowed: false, reason: lossCheck.reason, code: lossCheck.code };
      }
    }
  }

  // Risk Agent LLM — commentary only, real_check above is the actual gate.
  const riskPrompt = `Explain, in 2-3 sentences, why this trade proposal was ${realCheck.allowed ? "APPROVED" : "REJECTED"} against risk limits (max position size $${limits.max_position_size_usd}, daily loss cap $${limits.max_daily_loss_usd}, max ${limits.max_open_positions} open positions, stop-loss ${limits.stop_loss_pct}%):

Proposal:
- Symbol: ${plan.symbol}
- Side: ${plan.side}
- Qty: ${plan.qty}
- Real current price: ${realPrice ?? "unavailable"}
- Confidence: ${plan.confidence}
- Reasoning: ${plan.reasoning}

Actual verdict: ${realCheck.allowed ? "APPROVED" : "REJECTED"} — ${realCheck.reason}`;

  const risk = await bus.delegate("quant", "risk", riskPrompt);

  return NextResponse.json({
    correlation_id: correlationId,
    plan,
    real_price: realPrice,
    quant_output: quant.output,
    risk_output: risk.output,
    risk_approved: realCheck.allowed,
    risk_reason: realCheck.reason,
    risk_code: realCheck.code,
  });
});
