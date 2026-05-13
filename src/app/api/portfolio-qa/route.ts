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
  if (!body || typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Pull portfolio context
  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  const positions = new Map<string, { qty: number; cost: number }>();
  let totalTrades = 0;
  for (const t of trades ?? []) {
    if (t.status !== "filled") continue;
    totalTrades++;
    const cur = positions.get(t.symbol) ?? { qty: 0, cost: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    positions.set(t.symbol, cur);
  }
  const open = Array.from(positions.entries())
    .filter(([, p]) => Math.abs(p.qty) > 1e-9)
    .map(([symbol, p]) => ({
      symbol,
      qty: p.qty,
      avg_cost: Math.abs(p.cost) / Math.abs(p.qty),
      value: Math.abs(p.cost),
    }));
  const totalValue = open.reduce((s, p) => s + p.value, 0);

  const summary = open
    .map(
      (p) =>
        `${p.symbol}: ${p.qty.toFixed(4)} @ avg $${p.avg_cost.toFixed(
          2
        )} (${((p.value / totalValue) * 100).toFixed(1)}% weight)`
    )
    .join("\n");

  const prompt = `User question about their portfolio:

"${body.question}"

Context — their current paper trading positions (total value $${totalValue.toFixed(2)}, ${totalTrades} filled trades to date):
${summary || "No open positions."}

Answer their question directly using this context. If the question is general (not portfolio-specific), still answer factually but flag that you don't have direct data on it. Keep response under 250 words. End with: "Reminder: research only, not financial advice."`;

  try {
    const bus = new AgentBus(supabase, user.id, ALL_AGENTS, randomUUID());
    const result = await bus.invoke("ceo", prompt);
    return NextResponse.json({
      answer: result.output,
      positions: open.length,
      total_value: totalValue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
});
