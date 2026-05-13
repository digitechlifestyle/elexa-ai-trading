"use client";

import { useState } from "react";

interface Row {
  benchmark: string;
  beta: number | null;
  alpha_annualised?: number;
  r2: number | null;
  correlation: number | null;
  n?: number;
}

export default function MultiBetaClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/multi-beta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), days }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setRows([]); }
      else setRows(j.results);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">β Multi-Benchmark Beta</h1>
        <p className="text-[var(--muted)] text-sm">
          OLS regression of log returns vs SPY, QQQ, IWM, BTC, GLD. See which factor drives your symbol.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={90}>90</option><option value={180}>180</option>
              <option value={365}>365</option><option value={730}>730</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Regressing…" : "Run"}
            </button>
          </div>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {rows.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr className="text-left border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">Benchmark</th>
                <th className="py-2 pr-3 text-right">β</th>
                <th className="py-2 pr-3 text-right">α (annual %)</th>
                <th className="py-2 pr-3 text-right">R²</th>
                <th className="py-2 pr-3 text-right">Corr</th>
                <th className="py-2 pr-3 text-right">n</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.benchmark} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold">{r.benchmark}</td>
                  <td className="py-2 pr-3 text-right font-mono">{r.beta != null ? r.beta.toFixed(3) : "—"}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${(r.alpha_annualised ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {r.alpha_annualised != null ? `${r.alpha_annualised >= 0 ? "+" : ""}${r.alpha_annualised.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{r.r2 != null ? r.r2.toFixed(3) : "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono">{r.correlation != null ? r.correlation.toFixed(3) : "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono text-[var(--muted)]">{r.n ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Beta &gt; 1</strong>: moves more than benchmark. <strong>&lt; 1</strong>: less. <strong>&lt; 0</strong>: inverse.</p>
        <p><strong>R²</strong>: % of return variance explained. R² &gt; 0.5 = strong driver. &lt; 0.2 = noise.</p>
        <p><strong>Alpha</strong>: excess return after beta-adjusted exposure. Positive = genuine outperformance.</p>
        <p>Pick benchmark with highest R² as your true hedging factor.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Beta is historical and unstable across regimes. Research only.</div>
    </div>
  );
}
