import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";
import { matchTrades, RawTrade, equityCurve } from "@/lib/trade-analytics";

interface CheckResult { name: string; score: number; weight: number; detail: string; }

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tradesData } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const closed = matchTrades((tradesData ?? []) as RawTrade[]);
  const checks: CheckResult[] = [];

  // 1. Sample size — need >= 30 trades for stat significance
  const n = closed.length;
  const sampleScore = Math.min(100, (n / 30) * 100);
  checks.push({
    name: "Sample size",
    score: sampleScore,
    weight: 0.1,
    detail: `${n} closed trades (≥30 recommended)`,
  });

  // 2. Win rate
  const wins = closed.filter((t) => t.pnl > 0).length;
  const winRate = n > 0 ? (wins / n) * 100 : 0;
  // 50% = 70 score; >55% = 100; <40% = 0
  const wrScore = Math.max(0, Math.min(100, ((winRate - 40) / 15) * 100));
  checks.push({
    name: "Win rate",
    score: wrScore,
    weight: 0.1,
    detail: `${winRate.toFixed(1)}% (target ≥50%)`,
  });

  // 3. Profit factor
  const grossWin = closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 3 : 0;
  const pfScore = Math.max(0, Math.min(100, ((pf - 1) / 1) * 100));
  checks.push({
    name: "Profit factor",
    score: pfScore,
    weight: 0.2,
    detail: `${pf.toFixed(2)} (>1.5 strong, >2 elite)`,
  });

  // 4. Expectancy
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const expectancy = n > 0 ? totalPnl / n : 0;
  const expScore = expectancy > 0 ? Math.min(100, 50 + Math.min(50, expectancy)) : Math.max(0, 50 + expectancy);
  checks.push({
    name: "Per-trade expectancy",
    score: expScore,
    weight: 0.15,
    detail: `$${expectancy.toFixed(2)} (positive = edge)`,
  });

  // 5. Max drawdown of equity curve
  const eq = equityCurve(closed);
  const minDD = eq.reduce((min, p) => Math.min(min, p.drawdown_pct), 0);
  // -10% = 80, -25% = 50, -50% = 0
  const ddScore = Math.max(0, 100 + (minDD * 2));
  checks.push({
    name: "Max drawdown",
    score: ddScore,
    weight: 0.15,
    detail: `${minDD.toFixed(1)}% (less negative = better)`,
  });

  // 6. Concentration — % of trades in top symbol
  const symCounts: Record<string, number> = {};
  for (const t of closed) symCounts[t.symbol] = (symCounts[t.symbol] ?? 0) + 1;
  const maxSymPct = n > 0 ? (Math.max(...Object.values(symCounts), 0) / n) * 100 : 0;
  // <30% = 100, 50% = 50, >75% = 0
  const concScore = Math.max(0, Math.min(100, 100 - (maxSymPct - 30) * 2));
  checks.push({
    name: "Diversification",
    score: concScore,
    weight: 0.1,
    detail: `Top symbol = ${maxSymPct.toFixed(0)}% of trades`,
  });

  // 7. Journal usage — encourages discipline
  const { count: journalCount } = await supabase
    .from("journal_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const journalRatio = n > 0 ? Math.min(1, (journalCount ?? 0) / n) : 0;
  const journalScore = journalRatio * 100;
  checks.push({
    name: "Journal habit",
    score: journalScore,
    weight: 0.1,
    detail: `${journalCount ?? 0} entries for ${n} trades`,
  });

  // 8. Recency — active in last 30 days
  const lastTradeTime = closed.length > 0 ? new Date(closed[closed.length - 1].exit_time).getTime() : 0;
  const daysSinceLast = lastTradeTime ? (Date.now() - lastTradeTime) / 86400000 : 999;
  const recScore = daysSinceLast < 7 ? 100 : daysSinceLast < 30 ? 70 : daysSinceLast < 90 ? 40 : 0;
  checks.push({
    name: "Activity",
    score: recScore,
    weight: 0.1,
    detail: daysSinceLast < 999 ? `Last trade ${Math.round(daysSinceLast)} days ago` : "No trades yet",
  });

  // Weighted composite
  const weighted = checks.reduce((s, c) => s + c.score * c.weight, 0);
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const composite = totalWeight > 0 ? weighted / totalWeight : 0;

  let grade = "F";
  let gradeColor = "text-red-400";
  if (composite >= 85) { grade = "A"; gradeColor = "text-green-400"; }
  else if (composite >= 70) { grade = "B"; gradeColor = "text-green-300"; }
  else if (composite >= 55) { grade = "C"; gradeColor = "text-amber-400"; }
  else if (composite >= 40) { grade = "D"; gradeColor = "text-orange-400"; }

  return NextResponse.json({
    composite: Math.round(composite),
    grade, grade_color: gradeColor,
    checks,
    closed_trades: n,
  });
});
