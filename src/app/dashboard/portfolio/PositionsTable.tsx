"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface Position {
  symbol: string;
  qty: number;
  cost_basis: number;
  trades: number;
}

export default function PositionsTable({
  positions,
}: {
  positions: Position[];
}) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);

  useEffect(() => {
    if (positions.length === 0) {
      setLoading(false);
      return;
    }
    fetch("/api/trading/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exchange: "alpaca",
        symbols: positions.map((p) => p.symbol),
      }),
    })
      .then((r) => r.json())
      .then((d) => setPrices(d.prices ?? {}))
      .catch(() => setPrices({}))
      .finally(() => setLoading(false));
  }, [positions]);

  async function closePosition(symbol: string, qty: number) {
    if (!confirm(`Close ${symbol}? This places a sell order for ${qty} ${symbol}.`)) return;
    setClosing(symbol);
    try {
      const res = await fetch("/api/trading/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "alpaca",
          symbol,
          qty: Math.abs(qty),
          side: qty > 0 ? "sell" : "buy",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Close failed: ${data.error ?? res.statusText}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      alert(`Network error: ${e instanceof Error ? e.message : ""}`);
    } finally {
      setClosing(null);
    }
  }

  if (positions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No open positions. Place a buy order to open one.
      </p>
    );
  }

  let totalValue = 0;
  let totalCost = 0;
  let totalPnl = 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
          <tr>
            <th className="text-left py-2 px-2">Symbol</th>
            <th className="text-right py-2 px-2">Qty</th>
            <th className="text-right py-2 px-2">Avg cost</th>
            <th className="text-right py-2 px-2">Current</th>
            <th className="text-right py-2 px-2">Value</th>
            <th className="text-right py-2 px-2">P&amp;L</th>
            <th className="text-right py-2 px-2">P&amp;L %</th>
            <th className="text-right py-2 px-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const cur = prices[p.symbol];
            const avgCost =
              Math.abs(p.qty) > 0 ? Math.abs(p.cost_basis) / Math.abs(p.qty) : 0;
            const value = cur != null ? cur * Math.abs(p.qty) : null;
            const cost = Math.abs(p.cost_basis);
            const pnl = value != null ? value - cost : null;
            const pnlPct =
              value != null && cost > 0 ? ((value - cost) / cost) * 100 : null;
            if (value != null) {
              totalValue += value;
              totalCost += cost;
              totalPnl += pnl ?? 0;
            }
            return (
              <tr
                key={p.symbol}
                className="border-b border-[var(--card-border)] last:border-0"
              >
                <td className="py-2 px-2 font-medium">{p.symbol}</td>
                <td className="py-2 px-2 text-right">
                  {p.qty.toFixed(p.qty % 1 === 0 ? 0 : 4)}
                </td>
                <td className="py-2 px-2 text-right">${avgCost.toFixed(2)}</td>
                <td className="py-2 px-2 text-right">
                  {cur != null ? (
                    `$${cur.toFixed(2)}`
                  ) : loading ? (
                    <span className="text-[var(--muted)]">…</span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {value != null ? `$${value.toFixed(2)}` : "—"}
                </td>
                <td
                  className={`py-2 px-2 text-right ${
                    pnl == null
                      ? ""
                      : pnl >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {pnl != null
                    ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
                    : "—"}
                </td>
                <td
                  className={`py-2 px-2 text-right ${
                    pnlPct == null
                      ? ""
                      : pnlPct >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {pnlPct != null
                    ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`
                    : "—"}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => closePosition(p.symbol, p.qty)}
                    disabled={closing === p.symbol}
                    className="text-xs bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 px-2 py-1 rounded"
                  >
                    {closing === p.symbol ? "…" : "Close"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {!loading && (
          <tfoot className="text-sm font-semibold border-t-2 border-[var(--card-border)]">
            <tr>
              <td className="py-3 px-2" colSpan={4}>
                Total
              </td>
              <td className="py-3 px-2 text-right">${totalValue.toFixed(2)}</td>
              <td
                className={`py-3 px-2 text-right ${
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </td>
              <td
                className={`py-3 px-2 text-right ${
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totalCost > 0
                  ? `${totalPnl >= 0 ? "+" : ""}${((totalPnl / totalCost) * 100).toFixed(2)}%`
                  : "—"}
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
