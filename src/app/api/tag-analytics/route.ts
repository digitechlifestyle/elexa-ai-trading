import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface TagStat {
  tag: string;
  trades: number;
  total_pnl: number;
  avg_pnl: number;
  win_rate_pct: number;
  symbols: string[];
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tagMap = (user.user_metadata?.trade_tags ?? {}) as Record<string, string[]>;
  const taggedIds = Object.keys(tagMap);
  if (taggedIds.length === 0) {
    return NextResponse.json({ tags: [], untagged_count: 0 });
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("id, symbol, side, qty, filled_price, status")
    .eq("user_id", user.id)
    .in("id", taggedIds);

  if (!trades) {
    return NextResponse.json({ tags: [] });
  }

  // Each trade's $ flow: sells = +, buys = -
  const tradePnl = new Map<string, number>();
  for (const t of trades) {
    if (t.status !== "filled" || t.filled_price == null) continue;
    const val = Number(t.filled_price) * Number(t.qty);
    const sign = t.side === "sell" ? 1 : -1;
    tradePnl.set(t.id, sign * val);
  }

  // Aggregate by tag
  const byTag = new Map<
    string,
    { trades: number; pnl: number; wins: number; symbols: Set<string> }
  >();
  for (const t of trades) {
    const tags = tagMap[t.id] ?? [];
    for (const tag of tags) {
      const cur = byTag.get(tag) ?? {
        trades: 0,
        pnl: 0,
        wins: 0,
        symbols: new Set<string>(),
      };
      cur.trades += 1;
      cur.symbols.add(t.symbol);
      const pnl = tradePnl.get(t.id) ?? 0;
      cur.pnl += pnl;
      if (pnl > 0) cur.wins += 1;
      byTag.set(tag, cur);
    }
  }

  const tags: TagStat[] = Array.from(byTag.entries())
    .map(([tag, v]) => ({
      tag,
      trades: v.trades,
      total_pnl: v.pnl,
      avg_pnl: v.trades > 0 ? v.pnl / v.trades : 0,
      win_rate_pct: v.trades > 0 ? (v.wins / v.trades) * 100 : 0,
      symbols: Array.from(v.symbols),
    }))
    .sort((a, b) => b.total_pnl - a.total_pnl);

  return NextResponse.json({ tags });
});
