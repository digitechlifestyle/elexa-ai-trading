import { createClient } from "@/lib/supabase/server";
import AnalyticsCharts from "./AnalyticsCharts";

interface Trade {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  filled_price: number | null;
  status: string;
  created_at: string;
}

function localDate(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD UTC; close enough for daily buckets
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tradesRaw } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const trades: Trade[] = (tradesRaw ?? []) as Trade[];
  const filled = trades.filter(
    (t) => t.status === "filled" && t.filled_price != null
  );

  // Per-symbol P&L (sell value - buy cost)
  const symMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of filled) {
    const val = (t.filled_price ?? 0) * Number(t.qty);
    const sign = t.side === "sell" ? 1 : -1;
    const cur = symMap.get(t.symbol) ?? { pnl: 0, trades: 0 };
    cur.pnl += sign * val;
    cur.trades += 1;
    symMap.set(t.symbol, cur);
  }

  // Daily realised P&L — only realised when sells happen
  const dailyMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of filled) {
    const d = localDate(t.created_at);
    const cur = dailyMap.get(d) ?? { pnl: 0, trades: 0 };
    const val = (t.filled_price ?? 0) * Number(t.qty);
    cur.pnl += t.side === "sell" ? val : -val;
    cur.trades += 1;
    dailyMap.set(d, cur);
  }

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .reduce(
      (acc, [date, { pnl, trades: t }]) => {
        const last = acc[acc.length - 1];
        acc.push({
          date,
          pnl,
          trades: t,
          cumulative: (last?.cumulative ?? 0) + pnl,
        });
        return acc;
      },
      [] as { date: string; pnl: number; trades: number; cumulative: number }[]
    );

  const symbolStats = Array.from(symMap.entries()).map(([symbol, v]) => ({
    symbol,
    pnl: v.pnl,
    trades: v.trades,
  }));
  const topSymbols = symbolStats
    .filter((s) => s.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);
  const worstSymbols = symbolStats
    .filter((s) => s.pnl < 0)
    .sort((a, b) => a.pnl - b.pnl)
    .slice(0, 5);

  // Summary metrics
  const totalTrades = trades.length;
  const filledTrades = filled.length;
  const winners = symbolStats.filter((s) => s.pnl > 0).length;
  const losers = symbolStats.filter((s) => s.pnl < 0).length;
  const winRate =
    winners + losers > 0
      ? Math.round((winners / (winners + losers)) * 100)
      : 0;
  const totalPnl = daily.length > 0 ? daily[daily.length - 1].cumulative : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-[var(--muted)] text-sm">
          P&amp;L over time, win rate, and per-symbol breakdown. Based on filled
          paper trades.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} tone={totalPnl >= 0 ? "good" : "bad"} />
        <Metric label="Trades placed" value={String(totalTrades)} />
        <Metric label="Filled" value={String(filledTrades)} />
        <Metric label="Win rate (symbols)" value={`${winRate}%`} tone={winRate >= 50 ? "good" : winRate > 0 ? "warn" : undefined} />
      </div>

      <AnalyticsCharts
        daily={daily}
        topSymbols={topSymbols}
        worstSymbols={worstSymbols}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-green-400"
      : tone === "bad"
      ? "text-red-400"
      : tone === "warn"
      ? "text-amber-400"
      : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
