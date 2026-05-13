"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Result {
  strategy: string;
  symbol: string;
  bars_count: number;
  starting_cash: number;
  final_value: number;
  final_pnl_pct: number;
  buy_hold_pnl_pct: number;
  win_rate_pct: number;
  total_trades: number;
  equity_curve: { date: string; value: number }[];
}

const STRATEGIES = [
  { id: "sma_crossover", name: "SMA Crossover" },
  { id: "rsi_mean_reversion", name: "RSI Mean Reversion" },
];

export default function BacktestCompareClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [days, setDays] = useState("180");
  const [cash, setCash] = useState("10000");
  const [a, setA] = useState("sma_crossover");
  const [b, setB] = useState("rsi_mean_reversion");
  const [resultA, setResultA] = useState<Result | null>(null);
  const [resultB, setResultB] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runOne(strategy: string): Promise<Result | null> {
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
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Failed");
    return j.result as Result;
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResultA(null);
    setResultB(null);
    try {
      const [ra, rb] = await Promise.all([runOne(a), runOne(b)]);
      setResultA(ra);
      setResultB(rb);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const merged =
    resultA && resultB
      ? resultA.equity_curve.map((p, i) => ({
          date: p.date,
          strategy_a: p.value,
          strategy_b: resultB.equity_curve[i]?.value,
        }))
      : [];

  const winner =
    resultA && resultB
      ? resultA.final_pnl_pct > resultB.final_pnl_pct
        ? "A"
        : "B"
      : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⚔️ Backtest Comparison</h1>
        <p className="text-[var(--muted)] text-sm">
          A/B two strategies on the same symbol + period. Equity curves
          overlayed, side-by-side stats.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
      >
        <Field label="Symbol" value={symbol} onChange={setSymbol} />
        <Field label="Days" value={days} onChange={setDays} type="number" />
        <Field label="Starting cash $" value={cash} onChange={setCash} type="number" />
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Strategy A</label>
          <select
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Strategy B</label>
          <select
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Running…" : "Compare"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {resultA && resultB && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card r={resultA} side="A" winner={winner === "A"} />
            <Card r={resultB} side="B" winner={winner === "B"} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Equity curves</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={merged}>
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
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                />
                <Line type="monotone" dataKey="strategy_a" stroke="#6366f1" strokeWidth={2} dot={false} name={`A: ${resultA.strategy}`} />
                <Line type="monotone" dataKey="strategy_b" stroke="#22c55e" strokeWidth={2} dot={false} name={`B: ${resultB.strategy}`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Side-by-side backtest. Beware of overfitting — past performance ≠
        future. Research only.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

function Card({
  r,
  side,
  winner,
}: {
  r: Result;
  side: "A" | "B";
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 border-2 ${
        winner ? "bg-green-950 border-green-700" : "bg-[var(--card)] border-[var(--card-border)]"
      }`}
    >
      <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
        <div>
          <p className="text-xs text-[var(--muted)] uppercase">Strategy {side}{winner ? " 🏆" : ""}</p>
          <p className="font-semibold">{r.strategy}</p>
        </div>
        <p
          className={`text-2xl font-bold ${
            r.final_pnl_pct >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {r.final_pnl_pct >= 0 ? "+" : ""}
          {r.final_pnl_pct.toFixed(2)}%
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[var(--muted)]">Final value</p>
          <p className="font-mono">${r.final_value.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Buy &amp; Hold</p>
          <p className="font-mono">
            {r.buy_hold_pnl_pct >= 0 ? "+" : ""}
            {r.buy_hold_pnl_pct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Trades</p>
          <p className="font-mono">{r.total_trades}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Win rate</p>
          <p className="font-mono">{r.win_rate_pct.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
