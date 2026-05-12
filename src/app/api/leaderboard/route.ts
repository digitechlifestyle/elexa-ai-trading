import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface LeaderRow {
  user_id: string;
  display_name: string;
  pnl: number;
  trades: number;
  win_rate: number;
  first_trade: string;
}

/**
 * Public leaderboard — top traders by realised P&L. Privacy: only users with
 * user_metadata.public_leaderboard_opt_in = true are included. Anonymous
 * label "trader_xxxx" unless they've set a display_name.
 */
export const GET = withApi(async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "all"; // "7d" | "30d" | "all"
  const limit = Math.max(5, Math.min(50, Number(url.searchParams.get("limit")) || 20));

  const supabase = await createAdminClient();

  // Time filter
  let since: string | null = null;
  if (period === "7d") {
    since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  } else if (period === "30d") {
    since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  }

  let q = supabase
    .from("trades")
    .select("user_id, symbol, side, qty, filled_price, status, created_at")
    .eq("status", "filled")
    .eq("is_paper", true);
  if (since) q = q.gte("created_at", since);
  const { data: trades } = await q;

  if (!trades || trades.length === 0) {
    return NextResponse.json({ rows: [], period });
  }

  // Aggregate per user
  const byUser = new Map<
    string,
    {
      pnl: number;
      trades: number;
      symbols: Map<string, number>;
      first: string;
    }
  >();
  for (const t of trades) {
    const cur = byUser.get(t.user_id) ?? {
      pnl: 0,
      trades: 0,
      symbols: new Map(),
      first: t.created_at,
    };
    const val = Number(t.filled_price ?? 0) * Number(t.qty);
    const sign = t.side === "sell" ? 1 : -1;
    cur.pnl += sign * val;
    cur.trades += 1;
    const symPnl = cur.symbols.get(t.symbol) ?? 0;
    cur.symbols.set(t.symbol, symPnl + sign * val);
    if (t.created_at < cur.first) cur.first = t.created_at;
    byUser.set(t.user_id, cur);
  }

  // Filter to opt-in users
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: usersResp } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const optedIn = new Map<string, { display_name?: string }>();
  for (const u of usersResp?.users ?? []) {
    if (u.user_metadata?.public_leaderboard_opt_in) {
      optedIn.set(u.id, {
        display_name: u.user_metadata.display_name as string | undefined,
      });
    }
  }

  const rows: LeaderRow[] = [];
  for (const [userId, agg] of byUser.entries()) {
    if (!optedIn.has(userId)) continue;
    const winners = Array.from(agg.symbols.values()).filter((v) => v > 0).length;
    const losers = Array.from(agg.symbols.values()).filter((v) => v < 0).length;
    const winRate = winners + losers > 0 ? (winners / (winners + losers)) * 100 : 0;
    const profile = optedIn.get(userId)!;
    rows.push({
      user_id: userId,
      display_name: profile.display_name || `trader_${userId.slice(0, 4)}`,
      pnl: agg.pnl,
      trades: agg.trades,
      win_rate: Math.round(winRate),
      first_trade: agg.first,
    });
  }

  rows.sort((a, b) => b.pnl - a.pnl);
  return NextResponse.json({ rows: rows.slice(0, limit), period });
});
