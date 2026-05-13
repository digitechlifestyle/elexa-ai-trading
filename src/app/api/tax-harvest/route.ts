import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface Candidate {
  symbol: string;
  qty: number;
  avg_cost: number;
  current_price: number | null;
  unrealised_pl: number | null;
  unrealised_pl_pct: number | null;
  total_cost_basis: number;
  wash_sale_risk: boolean;
}

/**
 * Tax loss harvesting helper — find positions trading below cost.
 * Computes unrealised loss per holding using live prices.
 * Flags wash-sale risk if user bought the same symbol in last 30 days.
 */
export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "filled")
    .order("created_at", { ascending: true });

  if (!trades || trades.length === 0) {
    return NextResponse.json({ empty: true, candidates: [] });
  }

  // Build positions + last-30-day buy map
  const positions = new Map<
    string,
    { qty: number; cost: number; trades: number }
  >();
  const recentBuys = new Map<string, boolean>();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  for (const t of trades) {
    const cur = positions.get(t.symbol) ?? { qty: 0, cost: 0, trades: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    cur.trades += 1;
    positions.set(t.symbol, cur);
    if (t.side === "buy" && new Date(t.created_at) >= thirtyDaysAgo) {
      recentBuys.set(t.symbol, true);
    }
  }

  const holdings = Array.from(positions.entries())
    .filter(([, p]) => Math.abs(p.qty) > 1e-9)
    .map(([symbol, p]) => ({
      symbol,
      qty: p.qty,
      avg_cost: Math.abs(p.cost) / Math.abs(p.qty),
      total_cost_basis: Math.abs(p.cost),
    }));

  // Fetch live prices (single call to existing prices endpoint via internal fetch)
  let prices: Record<string, number | null> = {};
  if (holdings.length > 0) {
    try {
      const url = new URL(
        "/api/trading/prices",
        process.env.NEXT_PUBLIC_APP_URL ?? "https://elexa-ai-trading.vercel.app"
      );
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "alpaca",
          symbols: holdings.map((h) => h.symbol),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        prices = data?.prices ?? {};
      }
    } catch {
      // ignore — fall back to no prices
    }
  }

  const candidates: Candidate[] = holdings
    .map((h) => {
      const cur = prices[h.symbol] ?? null;
      const upl = cur != null ? (cur - h.avg_cost) * Math.abs(h.qty) : null;
      const uplPct = cur != null ? ((cur - h.avg_cost) / h.avg_cost) * 100 : null;
      return {
        symbol: h.symbol,
        qty: h.qty,
        avg_cost: h.avg_cost,
        current_price: cur,
        unrealised_pl: upl,
        unrealised_pl_pct: uplPct,
        total_cost_basis: h.total_cost_basis,
        wash_sale_risk: recentBuys.has(h.symbol),
      };
    })
    .filter((c) => c.unrealised_pl != null && c.unrealised_pl < 0)
    .sort((a, b) => (a.unrealised_pl ?? 0) - (b.unrealised_pl ?? 0));

  const totalLoss = candidates.reduce((s, c) => s + (c.unrealised_pl ?? 0), 0);

  return NextResponse.json({
    candidates,
    total_unrealised_loss: totalLoss,
  });
});
