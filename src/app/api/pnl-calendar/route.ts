import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { matchTrades, RawTrade } from "@/lib/trade-analytics";

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());

  const { data } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const closed = matchTrades((data ?? []) as RawTrade[]);

  const daily: Record<string, { pnl: number; trades: number }> = {};
  for (const t of closed) {
    const exit = new Date(t.exit_time);
    if (exit.getUTCFullYear() !== year) continue;
    const d = t.exit_time.slice(0, 10);
    if (!daily[d]) daily[d] = { pnl: 0, trades: 0 };
    daily[d].pnl += t.pnl;
    daily[d].trades += 1;
  }

  const totalPnl = Object.values(daily).reduce((s, v) => s + v.pnl, 0);
  const wins = Object.values(daily).filter((v) => v.pnl > 0).length;
  const losses = Object.values(daily).filter((v) => v.pnl < 0).length;
  const bestDay = Object.entries(daily).reduce((best, [d, v]) => v.pnl > (best?.pnl ?? -Infinity) ? { date: d, pnl: v.pnl } : best, null as { date: string; pnl: number } | null);
  const worstDay = Object.entries(daily).reduce((worst, [d, v]) => v.pnl < (worst?.pnl ?? Infinity) ? { date: d, pnl: v.pnl } : worst, null as { date: string; pnl: number } | null);

  return NextResponse.json({
    year,
    daily,
    summary: { total_pnl: totalPnl, winning_days: wins, losing_days: losses, best_day: bestDay, worst_day: worstDay },
  });
});
