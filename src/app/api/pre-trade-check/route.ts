import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbol = body.symbol.toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const side = body.side === "sell" ? "sell" : "buy";
  const qty = Math.max(0.000001, Number(body.qty) || 1);
  const entry = Math.max(0.0001, Number(body.entry) || 0);
  const stop = Number(body.stop);
  const target = Number(body.target);
  const thesis = String(body.thesis ?? "").slice(0, 1000);

  const prompt = `Pre-trade checklist review.

Trade:
- ${side.toUpperCase()} ${qty} ${symbol} @ $${entry.toFixed(2)}
- Stop: ${Number.isFinite(stop) ? `$${stop}` : "not set"}
- Target: ${Number.isFinite(target) ? `$${target}` : "not set"}
- Thesis: ${thesis || "(none provided)"}

Run through these 10 checks. For each, output PASS / WARN / FAIL + 1 sentence reason.

1. Setup clarity — is the thesis specific or vague?
2. Stop-loss defined — is there a hard exit?
3. R:R ratio — is risk-reward at least 1:2?
4. Position sizing — does the size match the conviction?
5. Catalyst alignment — is there a known driver / earnings risk?
6. Trend alignment — is the trade with or against the broader trend?
7. Volatility regime — does the implied vol justify the size?
8. Correlation check — does this stack on existing exposure?
9. Emotional check — is this a chase or a plan?
10. Exit plan — what happens at the stop AND the target?

End with: VERDICT — go / wait / skip — one line.`;

  try {
    const bus = new AgentBus(supabase, user.id, ALL_AGENTS, randomUUID());
    const result = await bus.invoke("quant", prompt);
    return NextResponse.json({
      symbol,
      side,
      qty,
      entry,
      stop: Number.isFinite(stop) ? stop : null,
      target: Number.isFinite(target) ? target : null,
      checklist: result.output,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
});
