import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { matchTrades, RawTrade } from "@/lib/trade-analytics";

interface GradedTrade {
  symbol: string;
  qty: number;
  entry_price: number;
  exit_price: number;
  entry_time: string;
  exit_time: string;
  pnl: number;
  return_pct: number;
  hold_hours: number;
  grade: "A" | "B" | "C" | "D" | "F";
  score: number;
  notes: string[];
}

function grade(r: number, holdHours: number): GradedTrade["grade"] {
  // Score from return + hold-time penalty for tiny returns held long
  let score = r * 20; // +1% return = +20 pts
  if (r > 0 && holdHours < 1) score -= 10; // scalp penalty
  if (r > 0 && holdHours > 24 * 30) score -= 10; // held too long penalty
  if (r < 0 && holdHours > 24 * 14) score -= 15; // averaging-down loser
  if (Math.abs(r) < 0.005) score -= 15; // dust trade — wasted commission
  if (score >= 40) return "A";
  if (score >= 15) return "B";
  if (score >= 0) return "C";
  if (score >= -15) return "D";
  return "F";
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const closed = matchTrades((data ?? []) as RawTrade[]);
  const graded: GradedTrade[] = closed.map((c) => {
    const holdMs = new Date(c.exit_time).getTime() - new Date(c.entry_time).getTime();
    const holdHours = holdMs / 3600000;
    const r = (c.exit_price - c.entry_price) / c.entry_price;
    const notes: string[] = [];
    if (Math.abs(r) < 0.005) notes.push("Dust trade — barely moved");
    if (r > 0 && holdHours < 1) notes.push("Scalp — fast win");
    if (r > 0 && holdHours > 24 * 30) notes.push("Long winner — could have exited sooner?");
    if (r < 0 && holdHours > 24 * 14) notes.push("Held loser too long");
    if (r > 0.05) notes.push("Big winner");
    if (r < -0.05) notes.push("Big loser — review setup");
    let score = r * 20;
    if (r > 0 && holdHours < 1) score -= 10;
    if (r > 0 && holdHours > 24 * 30) score -= 10;
    if (r < 0 && holdHours > 24 * 14) score -= 15;
    if (Math.abs(r) < 0.005) score -= 15;
    return {
      symbol: c.symbol, qty: c.qty,
      entry_price: c.entry_price, exit_price: c.exit_price,
      entry_time: c.entry_time, exit_time: c.exit_time,
      pnl: c.pnl, return_pct: r * 100,
      hold_hours: holdHours,
      grade: grade(r, holdHours),
      score: Math.round(score),
      notes,
    };
  });

  // Newest first
  graded.sort((a, b) => (a.exit_time > b.exit_time ? -1 : 1));

  const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const t of graded) dist[t.grade] += 1;

  return NextResponse.json({ trades: graded.slice(0, 100), distribution: dist, total: graded.length });
});
