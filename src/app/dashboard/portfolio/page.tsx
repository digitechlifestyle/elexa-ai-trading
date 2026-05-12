import { createClient } from "@/lib/supabase/server";
import PortfolioForm from "./PortfolioForm";
import PositionsTable from "./PositionsTable";
import ShareTradeButton from "./ShareTradeButton";
import TradeTags from "./TradeTags";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Recent trades for this user
  const { data: recent } = await supabase
    .from("trades")
    .select("id, symbol, side, qty, filled_price, status, is_paper, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const trades = recent ?? [];
  const tagMap = (user?.user_metadata?.trade_tags ?? {}) as Record<
    string,
    string[]
  >;

  // Build a "positions" view by netting buys and sells per symbol
  const positionsMap = new Map<
    string,
    { symbol: string; qty: number; cost_basis: number; trades: number }
  >();
  for (const t of trades) {
    if (t.status !== "filled" || t.filled_price == null) continue;
    const cur = positionsMap.get(t.symbol) ?? {
      symbol: t.symbol,
      qty: 0,
      cost_basis: 0,
      trades: 0,
    };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost_basis += sign * Number(t.qty) * Number(t.filled_price);
    cur.trades += 1;
    positionsMap.set(t.symbol, cur);
  }
  const positions = Array.from(positionsMap.values()).filter(
    (p) => Math.abs(p.qty) > 1e-9
  );

  return (
    <div className="space-y-8">
      <PortfolioForm />

      {/* Positions */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Open Positions</h2>
          <span className="text-xs text-[var(--muted)]">
            {positions.length} {positions.length === 1 ? "position" : "positions"} · live prices
          </span>
        </div>
        <PositionsTable positions={positions} />
      </div>

      {/* Recent trades */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Recent Trades</h2>
          <span className="text-xs text-[var(--muted)]">last 20</span>
        </div>
        {trades.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No trades yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Symbol</th>
                  <th className="text-left py-2 px-2">Side</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Tags</th>
                  <th className="text-right py-2 px-2">Share</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-2 px-2 text-[var(--muted)] text-xs">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 font-medium">{t.symbol}</td>
                    <td
                      className={`py-2 px-2 ${
                        t.side === "buy" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t.side.toUpperCase()}
                    </td>
                    <td className="py-2 px-2 text-right">{t.qty}</td>
                    <td className="py-2 px-2 text-right">
                      {t.filled_price != null
                        ? `$${Number(t.filled_price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 px-2 text-xs text-[var(--muted)]">
                      {t.status}
                    </td>
                    <td className="py-2 px-2">
                      <TradeTags
                        tradeId={t.id}
                        initial={tagMap[t.id] ?? []}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <ShareTradeButton tradeId={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
