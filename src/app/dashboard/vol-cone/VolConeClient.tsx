"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Row {
  window_days: number;
  min: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
  current: number;
}

interface Data {
  symbol: string;
  years: number;
  rows: Row[];
}

export default function VolConeClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("");
  const [years, setYears] = useState("3");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(s: string, y: number) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/vol-cone?symbol=${s}&years=${y}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(symbol, Number(years));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute current percentile rank for the most recent window (e.g. 30d)
  const latest = data?.rows.find((r) => r.window_days === 30) ?? data?.rows[0];
  let currentRank: number | null = null;
  if (latest) {
    if (latest.current < latest.p25) currentRank = 25;
    else if (latest.current < latest.median) currentRank = 50;
    else if (latest.current < latest.p75) currentRank = 75;
    else if (latest.current < latest.p90) currentRank = 90;
    else currentRank = 100;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Volatility Cone</h1>
        <p className="text-[var(--muted)] text-sm">
          Historical realised volatility distributions across windows. Tells you
          if current vol is &quot;cheap&quot; or &quot;expensive&quot; vs history. Hedge fund staple.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const s = input.trim().toUpperCase();
          if (s) {
            setSymbol(s);
            setInput("");
            load(s, Number(years));
          }
        }}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex flex-wrap gap-2 items-end"
      >
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbol — current: {symbol}
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="SPY, BTC, AAPL…"
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            min={1}
            max={5}
            className="w-20 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && data.rows.length > 0 && (
        <>
          {latest && (
            <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 text-center">
              <p className="text-xs text-[var(--muted)] uppercase">
                Current {latest.window_days}-day realised vol
              </p>
              <p className="text-5xl font-bold text-indigo-400 mt-2">
                {latest.current.toFixed(1)}%
              </p>
              <p className="text-sm mt-2">
                Median: {latest.median.toFixed(1)}% · Range:{" "}
                {latest.min.toFixed(1)}%–{latest.max.toFixed(1)}%
              </p>
              {currentRank != null && (
                <p
                  className={`text-xs mt-2 font-semibold ${
                    currentRank >= 75
                      ? "text-red-400"
                      : currentRank >= 50
                      ? "text-amber-400"
                      : "text-green-400"
                  }`}
                >
                  {currentRank >= 75
                    ? "⚠ Above 75th percentile — vol expensive"
                    : currentRank <= 25
                    ? "✓ Below 25th percentile — vol cheap"
                    : `${currentRank}th percentile — middle`}
                </p>
              )}
            </div>
          )}

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Volatility cone</h2>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={data.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="window_days"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `${v}d`}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => `${Number(v).toFixed(1)}%`}
                />
                <Area type="monotone" dataKey="max" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="max" />
                <Area type="monotone" dataKey="p75" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} name="p75" />
                <Area type="monotone" dataKey="p25" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="p25" />
                <Area type="monotone" dataKey="min" stroke="#22c55e" fill="#22c55e" fillOpacity={0.05} name="min" />
                <Line type="monotone" dataKey="median" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3 }} name="median" />
                <Line type="monotone" dataKey="current" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="current" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-3 text-center">
              Indigo line: current realised vol per window. Grey: historical median. Red zone: extreme (75th+ percentile). Green zone: low (≤25th).
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <h2 className="font-semibold p-3 border-b border-[var(--card-border)]">
              Full table
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="text-left py-2 px-3">Window</th>
                    <th className="text-right py-2 px-3">Min</th>
                    <th className="text-right py-2 px-3">p25</th>
                    <th className="text-right py-2 px-3">Median</th>
                    <th className="text-right py-2 px-3">p75</th>
                    <th className="text-right py-2 px-3">Max</th>
                    <th className="text-right py-2 px-3">Current</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr
                      key={r.window_days}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-2 px-3 font-medium">{r.window_days}d</td>
                      <td className="py-2 px-3 text-right text-[var(--muted)]">{r.min.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{r.p25.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right font-semibold">{r.median.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{r.p75.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-[var(--muted)]">{r.max.toFixed(1)}%</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          r.current > r.p75
                            ? "text-red-400"
                            : r.current < r.p25
                            ? "text-green-400"
                            : ""
                        }`}
                      >
                        {r.current.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Realised vol ≠ implied vol. Options are priced off IV (forward),
        cone is historical (backward). Useful for benchmarking. Research only.
      </div>
    </div>
  );
}
