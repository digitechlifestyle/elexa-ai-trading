import { createClient } from "@/lib/supabase/server";
import { AgentBus } from "@/lib/agents/bus";
import { ALL_AGENTS } from "@/lib/agents/registry";
import { withApi } from "@/lib/observability/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface Holding {
  symbol: string;
  qty: number;
  cost_basis: number;
  current_price: number | null;
  weight_pct: number;
}

export const POST = withApi(async function POST() {
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

  // Build positions from filled trades
  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status")
    .eq("user_id", user.id)
    .eq("status", "filled");

  if (!trades || trades.length === 0) {
    return NextResponse.json({
      review: "No filled trades yet. Place a few paper trades, then come back for an AI review.",
      holdings: [],
    });
  }

  const positions = new Map<string, { qty: number; cost: number }>();
  for (const t of trades) {
    const cur = positions.get(t.symbol) ?? { qty: 0, cost: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    positions.set(t.symbol, cur);
  }

  const active = Array.from(positions.entries()).filter(
    ([, p]) => Math.abs(p.qty) > 1e-9
  );
  if (active.length === 0) {
    return NextResponse.json({
      review: "All positions closed. No current exposure to review.",
      holdings: [],
    });
  }

  // Fetch live prices in parallel via internal price endpoint (admin call would
  // be cleaner, but inline fetch keeps code simple)
  const symbols = active.map(([s]) => s);
  let prices: Record<string, number | null> = {};
  try {
    const priceUrl = new URL(
      "/api/trading/prices",
      process.env.NEXT_PUBLIC_APP_URL ?? "https://elexa-ai-trading.vercel.app"
    );
    const pr = await fetch(priceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exchange: "alpaca", symbols }),
    });
    if (pr.ok) {
      const j = await pr.json();
      prices = j.prices ?? {};
    }
  } catch {
    // ignore — review still works without current prices
  }

  const holdings: Holding[] = active.map(([symbol, p]) => {
    const cur = prices[symbol];
    const value = cur != null ? cur * Math.abs(p.qty) : Math.abs(p.cost);
    return {
      symbol,
      qty: p.qty,
      cost_basis: p.cost,
      current_price: cur ?? null,
      weight_pct: 0, // fill below
      _value: value,
    } as Holding & { _value: number };
  });
  const totalValue = (holdings as (Holding & { _value: number })[]).reduce(
    (s, h) => s + h._value,
    0
  );
  for (const h of holdings as (Holding & { _value: number })[]) {
    h.weight_pct = totalValue > 0 ? (h._value / totalValue) * 100 : 0;
  }

  // Build prompt
  const summary = holdings
    .map((h) => {
      const cur = h.current_price != null ? `$${h.current_price.toFixed(2)}` : "—";
      const avgCost =
        Math.abs(h.qty) > 0 ? Math.abs(h.cost_basis) / Math.abs(h.qty) : 0;
      const pnlPct =
        h.current_price != null && avgCost > 0
          ? ((h.current_price - avgCost) / avgCost) * 100
          : null;
      return `- ${h.symbol}: qty ${h.qty.toFixed(2)}, avg cost $${avgCost.toFixed(
        2
      )}, current ${cur}, weight ${h.weight_pct.toFixed(1)}%${
        pnlPct != null ? `, unrealised P&L ${pnlPct.toFixed(1)}%` : ""
      }`;
    })
    .join("\n");

  const prompt = `Review this paper-trading portfolio. Output as markdown with these sections:

## Overview
2-3 sentences on the overall posture (risk-on/off, concentration, sector tilt, asset class mix).

## Strengths
2-3 bullets — what's well-positioned.

## Concerns
2-3 bullets — concentration, correlated bets, missing diversifiers.

## Suggested adjustments
2-3 bullets — specific rebalance ideas. Mention symbols. Frame as research, not advice. Include one diversifier idea.

## Risk note
1 sentence reminder of paper-only nature.

Portfolio (total value $${totalValue.toFixed(2)}):
${summary}`;

  try {
    const bus = new AgentBus(supabase, user.id, ALL_AGENTS, randomUUID());
    const result = await bus.invoke("ceo", prompt);
    return NextResponse.json({
      review: result.output,
      holdings: holdings.map((h) => ({
        symbol: h.symbol,
        qty: h.qty,
        cost_basis: h.cost_basis,
        current_price: h.current_price,
        weight_pct: h.weight_pct,
      })),
      total_value: totalValue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
});
