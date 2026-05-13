"use client";

import { useState } from "react";

interface Row {
  symbol: string;
  error?: boolean;
  price?: number;
  high?: number;
  high_date?: string;
  days_since_high?: number;
  low?: number;
  low_date?: string;
  from_high_pct?: number;
  from_low_pct?: number;
}

export default function AthDistanceClient() {
  const [input, setInput] = useState("AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA,SPY,QQQ,BTC,ETH,SOL");
  const [lookback, setLookback] = useState(365);
  const [pullbackMin, setPullbackMin] = useState(10); // filter
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [view, setView] = useState<"all" | "pullback" | "near-high">("all");

  async function run() {
    setLoading(true); setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/ath-distance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, lookback_days: lookback }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setRows([]); }
      else setRows(j.results);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const valid = rows.filter((r) => !r.error);
  const filtered = view === "pullback"
    ? valid.filter((r) => (r.from_high_pct ?? 0) <= -pullbackMin)
    : view === "near-high"
    ? valid.filter((r) => (r.from_high_pct ?? -999) >= -5)
    : valid;
  const sorted = [...filtered].sort((a, b) => (b.from_high_pct ?? 0) - (a.from_high_pct ?? 0));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎯 ATH Distance Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          How far is each symbol from its high (last {lookback} days)? Find pullback candidates and breakout-ready leaders.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Lookback</label>
            <select value={lookback} onChange={(e) => setLookback(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={90}>90 days</option><option value={180}>180 days</option>
              <option value={365}>365 days (52w)</option><option value={730}>730 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Pullback filter ≥</label>
            <input type="number" value={pullbackMin} step={1}
              onChange={(e) => setPullbackMin(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Scanning…" : "Scan"}
            </button>
          </div>
        </div>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {valid.length > 0 && (
        <>
          <div className="flex gap-2 border-b border-[var(--card-border)]">
            {(["all", "near-high", "pullback"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  view === v ? "border-b-2 border-indigo-500 text-white" : "text-[var(--muted)] hover:text-white"
                }`}>
                {v === "all" ? "All" : v === "near-high" ? `Near high (≤5%)` : `Pullback ≥${pullbackMin}%`}
              </button>
            ))}
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)]">
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2 pr-3 text-right">Price</th>
                  <th className="py-2 pr-3 text-right">High</th>
                  <th className="py-2 pr-3 text-right">From high</th>
                  <th className="py-2 pr-3 text-right">Days since</th>
                  <th className="py-2 pr-3 text-right">Low</th>
                  <th className="py-2 pr-3 text-right">From low</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                    <td className="py-2 pr-3 text-right font-mono">${r.price?.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-mono">${r.high?.toFixed(2)}</td>
                    <td className={`py-2 pr-3 text-right font-mono ${(r.from_high_pct ?? 0) >= -2 ? "text-green-400" : (r.from_high_pct ?? 0) >= -10 ? "text-amber-400" : "text-red-400"}`}>
                      {r.from_high_pct?.toFixed(2)}%
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-[var(--muted)]">{r.days_since_high}d</td>
                    <td className="py-2 pr-3 text-right font-mono">${r.low?.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-green-400">+{r.from_low_pct?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ High is over your chosen lookback, not absolute ATH. Crypto and old stocks may have higher historical peaks. Research only.
      </div>
    </div>
  );
}
