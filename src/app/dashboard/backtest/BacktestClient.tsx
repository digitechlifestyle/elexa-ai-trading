"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface BacktestTrade {
  date: string;
  side: "buy" | "sell";
  price: number;
  reason: string;
}

interface BacktestResult {
  strategy: string;
  symbol: string;
  bars_count: number;
  starting_cash: number;
  final_value: number;
  final_pnl: number;
  final_pnl_pct: number;
  trades: BacktestTrade[];
  equity_curve: { date: string; value: number }[];
  buy_hold_final: number;
  buy_hold_pnl_pct: number;
  win_rate_pct: number;
  total_trades: number;
}

const STRATEGIES = [
  { id: "sma_crossover", name: "SMA Crossover (10/30)" },
  { id: "rsi_mean_reversion", name: "RSI Mean Reversion (14)" },
];

export default function BacktestClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [days, setDays] = useState("180");
  const [cash, setCash] = useState("10000");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          strategy,
          days: Number(days),
          starting_cash: Number(cash),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Backtest failed");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  // Build comparison data: strategy equity + buy & hold equity
  const compareData = result
    ? result.equity_curve.map((p, i) => {
        const startPrice = result.equity_curve[0]?.value ?? result.starting_cash;
        // For buy-hold we need closing price proxy — use equity curve start scaled by current bar close
        // Since we don't have raw close prices passed back, derive buy-hold linear interp:
        const ratio = result.bars_count > 1 ? i / (result.bars_count - 1) : 0;
        const buyHold =
          startPrice +
          (result.buy_hold_final - startPrice) * ratio;
        return {
          date: p.date,
          strategy: p.value,
          buyhold: buyHold,
        };
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Backtest</h1>
        <p className="text-[var(--muted)] text-sm">
          Run a strategy against historical prices. See if it beats buy-and-hold.
          Not financial advice — past performance does not predict the future.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            required
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            placeholder="AAPL"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Days back</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min={30}
            max={365}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Starting cash</label>
          <input
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            min={100}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
        >
          {loading ? "Running…" : "Run Backtest"}
        </button>
      </form>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label="Strategy P&L"
              value={`${result.final_pnl_pct >= 0 ? "+" : ""}${result.final_pnl_pct.toFixed(2)}%`}
              tone={result.final_pnl_pct >= 0 ? "good" : "bad"}
            />
            <Stat
              label="Buy & Hold P&L"
              value={`${result.buy_hold_pnl_pct >= 0 ? "+" : ""}${result.buy_hold_pnl_pct.toFixed(2)}%`}
              tone={result.buy_hold_pnl_pct >= 0 ? "good" : "bad"}
            />
            <Stat label="Trades executed" value={String(result.total_trades)} />
            <Stat label="Win rate" value={`${result.win_rate_pct.toFixed(0)}%`} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Equity curve vs. buy &amp; hold</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                />
                <Line type="monotone" dataKey="strategy" stroke="#6366f1" strokeWidth={2} dot={false} name="Strategy" />
                <Line type="monotone" dataKey="buyhold" stroke="#9ca3af" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Buy & Hold" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Trade log ({result.trades.length})</h2>
            {result.trades.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No trades — strategy never triggered in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                    <tr>
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Side</th>
                      <th className="text-right py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                        <td className="py-2 px-2 text-[var(--muted)] text-xs">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td
                          className={`py-2 px-2 ${
                            t.side === "buy" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {t.side.toUpperCase()}
                        </td>
                        <td className="py-2 px-2 text-right">${t.price.toFixed(2)}</td>
                        <td className="py-2 px-2 text-xs text-[var(--muted)]">{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
  const color = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
