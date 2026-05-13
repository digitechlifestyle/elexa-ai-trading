import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface DailyPnl {
  date: string;
  pnl: number;
  cumulative: number;
}

const RISK_FREE_ANNUAL = 0.04; // 4% — approx 10Y yield

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
    return NextResponse.json({
      empty: true,
      message: "No filled trades yet. Place trades to see risk metrics.",
    });
  }

  // Aggregate realised P&L per day
  const daily = new Map<string, number>();
  for (const t of trades) {
    const day = t.created_at.slice(0, 10);
    const val = Number(t.filled_price ?? 0) * Number(t.qty);
    const sign = t.side === "sell" ? 1 : -1;
    daily.set(day, (daily.get(day) ?? 0) + sign * val);
  }

  // Build daily series sorted
  const days = Array.from(daily.entries()).sort(([a], [b]) =>
    a < b ? -1 : 1
  );
  const equity: DailyPnl[] = [];
  let cum = 0;
  for (const [date, pnl] of days) {
    cum += pnl;
    equity.push({ date, pnl, cumulative: cum });
  }

  // Daily returns relative to running equity. Use peak as denominator alternative.
  // For Sharpe: use raw daily P&L over its mean baseline (treat as $ returns since no defined notional).
  const pnls = equity.map((e) => e.pnl);
  const mean = pnls.length > 0 ? pnls.reduce((s, v) => s + v, 0) / pnls.length : 0;
  const variance =
    pnls.length > 1
      ? pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / (pnls.length - 1)
      : 0;
  const std = Math.sqrt(variance);
  const sharpe_daily = std > 0 ? mean / std : 0;
  const sharpe_annual = sharpe_daily * Math.sqrt(252);

  // Sortino — only downside std
  const downside = pnls.filter((p) => p < 0);
  const downside_std =
    downside.length > 0
      ? Math.sqrt(
          downside.reduce((s, v) => s + v ** 2, 0) / downside.length
        )
      : 0;
  const sortino_daily = downside_std > 0 ? mean / downside_std : 0;
  const sortino_annual = sortino_daily * Math.sqrt(252);

  // Max drawdown — from running peak of cumulative
  let peak = -Infinity;
  let maxDd = 0;
  let maxDdPct = 0;
  let ddStart: string | null = null;
  let ddEnd: string | null = null;
  let currentDdStart: string | null = null;
  for (const e of equity) {
    if (e.cumulative > peak) {
      peak = e.cumulative;
      currentDdStart = e.date;
    }
    const dd = peak - e.cumulative;
    const ddPct = peak !== 0 ? (dd / Math.abs(peak)) * 100 : 0;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdPct = ddPct;
      ddStart = currentDdStart;
      ddEnd = e.date;
    }
  }

  // Best / worst day
  const bestDay = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstDay = pnls.length > 0 ? Math.min(...pnls) : 0;

  // Calmar — annualised return / max drawdown
  const annualised_pnl = mean * 252;
  const calmar = maxDd > 0 ? annualised_pnl / maxDd : 0;

  // Risk-free reference (just for display — not subtracted because $ P&L is unitless return-wise)
  return NextResponse.json({
    days_active: equity.length,
    total_pnl: cum,
    mean_daily_pnl: mean,
    daily_volatility: std,
    annualised_pnl,
    annualised_volatility: std * Math.sqrt(252),
    sharpe_annual,
    sortino_annual,
    max_drawdown: maxDd,
    max_drawdown_pct: maxDdPct,
    drawdown_start: ddStart,
    drawdown_end: ddEnd,
    best_day: bestDay,
    worst_day: worstDay,
    calmar,
    risk_free_annual: RISK_FREE_ANNUAL,
    equity,
  });
});
