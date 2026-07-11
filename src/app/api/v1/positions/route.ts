import { createAdminClient } from "@/lib/supabase/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — provide Bearer eai_<key>" },
      { status: 401 }
    );
  }
  const rl = await checkRateLimit({ key: `v1:${auth.userId}`, ...RATE_LIMITS.api });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "retry-after": "60" } }
      );
  }
  
  const supabase = await createAdminClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status")
    .eq("user_id", auth.userId)
    .eq("status", "filled");

  const positions = new Map<string, { qty: number; cost_basis: number; trades: number }>();
  for (const t of trades ?? []) {
    const cur = positions.get(t.symbol) ?? { qty: 0, cost_basis: 0, trades: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost_basis += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    cur.trades += 1;
    positions.set(t.symbol, cur);
  }

  const out = Array.from(positions.entries())
    .filter(([, p]) => Math.abs(p.qty) > 1e-9)
    .map(([symbol, p]) => ({
      symbol,
      qty: p.qty,
      cost_basis: p.cost_basis,
      avg_cost: Math.abs(p.qty) > 0 ? Math.abs(p.cost_basis) / Math.abs(p.qty) : 0,
      trades: p.trades,
    }));

  return NextResponse.json({ positions: out });
}
