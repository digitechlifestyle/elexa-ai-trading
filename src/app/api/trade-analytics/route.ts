import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import {
  matchTrades, rDistribution, byHour, byWeekday, equityCurve, RawTrade,
} from "@/lib/trade-analytics";

export const GET = withApi(async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const trades = (data ?? []) as RawTrade[];
  const closed = matchTrades(trades);

  const wins = closed.filter((t) => t.pnl > 0).length;
  const losses = closed.filter((t) => t.pnl < 0).length;
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins ? closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
  const avgLoss = losses ? closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / losses : 0;
  const winRate = closed.length ? (wins / closed.length) * 100 : 0;
  const expectancy = closed.length ? totalPnl / closed.length : 0;
  const profitFactor = Math.abs(avgLoss) > 0 && losses > 0
    ? (wins * avgWin) / Math.abs(losses * avgLoss)
    : null;

  return NextResponse.json({
    summary: {
      closed_trades: closed.length,
      wins, losses,
      win_rate: winRate,
      total_pnl: totalPnl,
      avg_win: avgWin,
      avg_loss: avgLoss,
      expectancy,
      profit_factor: profitFactor,
    },
    r_distribution: rDistribution(closed),
    by_hour: byHour(closed),
    by_weekday: byWeekday(closed),
    equity_curve: equityCurve(closed),
  });
});
