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
  symbol: string;
  side: "long" | "short";
  days: number;
  trail_pct: number;
  trail_dollar: number | null;
  entry: number;
  final_price: number;
  pnl_per_share: number;
  pnl_pct: number;
  max_favourable_pct: number;
  exit: { date: string; price: number } | null;
  series: { date: string; close: number; stop: number }[];
}

export default function TrailingStopClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [side, setSide] = useState<"long" | "short">("long");
  const [days, setDays] = useState("180");
  const [trailPct, setTrailPct] = useState("5");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/trailing-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          days: Number(days),
          trail_pct: Number(trailPct),
        }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📉 Trailing Stop Simulator</h1>
        <p className="text-[var(--muted)] text-sm">
          Backtest a trailing stop on any symbol. Test if a 3%, 5%, or 10% trail
          would have held through volatility.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Side</label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "long" | "short")}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
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
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Trail %</label>
          <input
            type="number"
            step="0.1"
            value={trailPct}
            onChange={(e) => setTrailPct(e.target.value)}
            min={0.1}
            max={50}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Running…" : "Simulate"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Entry" value={`$${data.entry.toFixed(2)}`} />
            <Stat
              label="Exit"
              value={data.exit ? `$${data.exit.price.toFixed(2)}` : "Still open"}
            />
            <Stat
              label="P&L"
              value={`${data.pnl_pct >= 0 ? "+" : ""}${data.pnl_pct.toFixed(2)}%`}
              tone={data.pnl_pct >= 0 ? "good" : "bad"}
            />
            <Stat
              label="Max favourable"
              value={`+${data.max_favourable_pct.toFixed(2)}%`}
              tone="good"
            />
          </div>

          {data.exit && (
            <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-sm">
              Stop triggered{" "}
              <span className="font-semibold">
                {new Date(data.exit.date).toLocaleDateString()}
              </span>{" "}
              at <span className="font-mono">${data.exit.price.toFixed(2)}</span>.
            </div>
          )}

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Price vs trailing stop</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.series}>
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
                  dataKey="close"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Close"
                />
                <Line
                  type="monotone"
                  dataKey="stop"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Trailing stop"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Daily-bar simulation. Intraday wicks may not trigger on real exchange.
        Slippage on stop fills ignored. Not financial advice.
      </div>
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
