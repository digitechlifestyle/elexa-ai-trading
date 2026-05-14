import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { matchTrades, RawTrade } from "@/lib/trade-analytics";

interface Goal {
  starting_capital: number;
  target_pct: number;
  target_date: string; // ISO yyyy-mm-dd
  started_at: string;
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = user.user_metadata?.trading_goal as Goal | undefined;

  const { data } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const closed = matchTrades((data ?? []) as RawTrade[]);
  const realisedPnl = closed.reduce((s, t) => s + t.pnl, 0);

  if (!goal) {
    return NextResponse.json({ goal: null, realised_pnl: realisedPnl });
  }

  const startTime = new Date(goal.started_at).getTime();
  const endTime = new Date(goal.target_date).getTime();
  const now = Date.now();
  const totalMs = endTime - startTime;
  const elapsedMs = now - startTime;
  const timeProgress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;
  const daysRemaining = Math.max(0, Math.round((endTime - now) / 86400000));

  // Only count P&L from trades after goal started
  const sinceStart = closed.filter((t) => new Date(t.exit_time).getTime() >= startTime);
  const pnlSinceStart = sinceStart.reduce((s, t) => s + t.pnl, 0);
  const returnPct = (pnlSinceStart / goal.starting_capital) * 100;
  const progressPct = (returnPct / goal.target_pct) * 100;

  // Pace: on track if progress ≥ time elapsed
  const onPace = progressPct >= timeProgress * 100;
  const requiredPace = totalMs > 0 ? (goal.target_pct / (totalMs / 86400000)) : 0; // % per day target

  return NextResponse.json({
    goal,
    realised_pnl: realisedPnl,
    pnl_since_start: pnlSinceStart,
    return_pct: returnPct,
    progress_pct: progressPct,
    time_progress_pct: timeProgress * 100,
    days_remaining: daysRemaining,
    on_pace: onPace,
    required_pace_per_day: requiredPace,
    trades_since_start: sinceStart.length,
  });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { starting_capital, target_pct, target_date } = await request.json();
  if (typeof starting_capital !== "number" || starting_capital <= 0) {
    return NextResponse.json({ error: "Invalid starting capital" }, { status: 422 });
  }
  if (typeof target_pct !== "number" || target_pct === 0) {
    return NextResponse.json({ error: "Invalid target %" }, { status: 422 });
  }
  if (typeof target_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return NextResponse.json({ error: "Invalid target date" }, { status: 422 });
  }

  const goal: Goal = {
    starting_capital, target_pct, target_date,
    started_at: new Date().toISOString(),
  };

  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, trading_goal: goal },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, goal });
});

export const DELETE = withApi(async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const md = { ...user.user_metadata };
  delete md.trading_goal;
  const { error } = await supabase.auth.updateUser({ data: md });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
});
