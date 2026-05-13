"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

interface TradePoint {
  id: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  date: string;
}

interface Bar {
  t: string;
  c: number;
}

interface Data {
  symbol: string;
  trades: TradePoint[];
  bars: Bar[];
}

export default function TradeReplayClient() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  // Pull list of symbols user has traded
  useEffect(() => {
    fetch("/api/v1/trades?limit=500", {
      // No bearer — server view will accept via supabase auth.
      // The /v1 route is for API keys but trades exist in DB anyway via our own endpoint.
    })
      .catch(() => null);
    // Simpler: fetch via own internal trades list (use existing /api/portfolio/risk-metrics ? no)
    // Easiest path: load trade-replay with a default symbol on demand; pull distinct symbols inline.
    fetch("/api/trades-distinct")
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j.symbols) && j.symbols.length > 0) {
            setSymbols(j.symbols);
            if (!symbol) setSymbol(j.symbols[0]);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(s: string) {
    if (!s) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/trade-replay?symbol=${s}`);
      const j = await res.json();
      if (res.ok) setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (symbol) load(symbol);
  }, [symbol]);

  const summary = useMemo(() => {
    if (!data || data.trades.length === 0) return null;
    let cash = 0;
    let qty = 0;
    let cost = 0;
    for (const t of data.trades) {
      const sign = t.side === "buy" ? 1 : -1;
      qty += sign * t.qty;
      cost += sign * t.qty * t.price;
      cash += t.side === "sell" ? t.qty * t.price : -t.qty * t.price;
    }
    const lastPrice = data.bars[data.bars.length - 1]?.c ?? 0;
    const value = qty * lastPrice;
    const totalPnl = cash + value;
    return { qty, lastPrice, value, totalPnl, cash, cost: Math.abs(cost) };
  }, [data]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎬 Trade Replay</h1>
        <p className="text-[var(--muted)] text-sm">
          Visualise your past entries and exits on a chart. Spot patterns in
          your own trading.
        </p>
      </div>

      {symbols.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          No trades yet. Place some trades on Portfolio first.
        </div>
      ) : (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex gap-2 flex-wrap items-center">
            <span className="text-xs text-[var(--muted)] mr-2">Symbol:</span>
            {symbols.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={`text-xs px-3 py-1.5 rounded ${
                  symbol === s
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
              Loading…
            </div>
          ) : data && data.bars.length > 0 ? (
            <>
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Holdings" value={summary.qty.toFixed(4)} />
                  <Stat label="Last price" value={`$${summary.lastPrice.toFixed(2)}`} />
                  <Stat label="Current value" value={`$${summary.value.toFixed(2)}`} />
                  <Stat
                    label="Total P&L"
                    value={`${summary.totalPnl >= 0 ? "+" : ""}$${summary.totalPnl.toFixed(2)}`}
                    tone={summary.totalPnl >= 0 ? "good" : "bad"}
                  />
                </div>
              )}

              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
                <h2 className="font-semibold mb-3">
                  {symbol} with your entries/exits
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.bars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis
                      dataKey="t"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        background: "#12121a",
                        border: "1px solid #1e1e2e",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v) => `$${Number(v).toFixed(2)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="c"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      name="Close"
                    />
                    {data.trades.map((t) => {
                      const dateKey = t.date.slice(0, 10);
                      // Find matching bar
                      const bar = data.bars.find((b) => b.t.slice(0, 10) === dateKey);
                      if (!bar) return null;
                      return (
                        <ReferenceDot
                          key={t.id}
                          x={bar.t}
                          y={t.price}
                          r={6}
                          fill={t.side === "buy" ? "#22c55e" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-[var(--muted)] mt-2 text-center">
                  🟢 buy · 🔴 sell. Bigger dot = bigger size (not yet visualised — TBD).
                </p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                <h2 className="font-semibold p-3 border-b border-[var(--card-border)]">
                  Trade log
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                      <tr>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Side</th>
                        <th className="text-right py-2 px-3">Qty</th>
                        <th className="text-right py-2 px-3">Price</th>
                        <th className="text-right py-2 px-3">Notional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trades.map((t) => (
                        <tr key={t.id} className="border-b border-[var(--card-border)] last:border-0">
                          <td className="py-2 px-3 text-[var(--muted)] text-xs">
                            {new Date(t.date).toLocaleString()}
                          </td>
                          <td
                            className={`py-2 px-3 font-semibold ${
                              t.side === "buy" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {t.side.toUpperCase()}
                          </td>
                          <td className="py-2 px-3 text-right">{t.qty.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right">${t.price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">${(t.qty * t.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
              No data.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const c = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
