"use client";

import { useState } from "react";

export default function HurstClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{ hurst: number; regime: string; advice: string; color: string } | null>(null);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/hurst", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), days }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const h = data?.hurst ?? 0.5;
  const pct = Math.max(0, Math.min(100, h * 100));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🔬 Hurst Exponent</h1>
        <p className="text-[var(--muted)] text-sm">
          R/S analysis classifies market regime: mean-reverting (H&lt;0.5), random walk (H≈0.5), trending (H&gt;0.5).
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={180}>180</option><option value={365}>365</option><option value={730}>730</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Computing…" : "Compute"}
            </button>
          </div>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
          <p className="text-xs text-[var(--muted)] mb-1">Hurst exponent</p>
          <p className="text-5xl font-bold font-mono mb-2">{h.toFixed(3)}</p>
          <p className={`text-2xl font-bold ${data.color}`}>{data.regime}</p>
          <p className="text-sm text-[var(--muted)] mt-2">{data.advice}</p>
          <div className="mt-6 h-3 bg-[var(--background)] rounded relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 right-0 flex">
              <div className="flex-1 bg-blue-500/30" />
              <div className="flex-1 bg-amber-500/30" />
              <div className="flex-1 bg-green-500/30" />
            </div>
            <div className="absolute inset-y-0 w-1 bg-white" style={{ left: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
            <span>Mean-revert (0)</span><span>Random (0.5)</span><span>Trend (1)</span>
          </div>
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>H &lt; 0.5:</strong> anti-persistent — up day often followed by down day. Mean-reversion strategies fit.</p>
        <p><strong>H ≈ 0.5:</strong> random — no edge from price history alone.</p>
        <p><strong>H &gt; 0.5:</strong> persistent — moves tend to continue. Trend-following fits.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Hurst is a statistical aggregate over the window. Regime can change abruptly. Research only.</div>
    </div>
  );
}
