"use client";

import { useState } from "react";

interface Stat { symbol: string; annual_return_pct: number; annual_vol_pct: number; sharpe: number; }
interface Alloc { symbol: string; weight: number; dollars: number; }
interface Data {
  capital: number;
  stats: Stat[];
  allocations: {
    equal_weight: Alloc[];
    inverse_vol: Alloc[];
    max_sharpe_proxy: Alloc[];
  };
}

export default function AllocatorClient() {
  const [input, setInput] = useState("SPY,QQQ,GLD,TLT,BTC");
  const [capital, setCapital] = useState(10000);
  const [days, setDays] = useState(365);
  const [rf, setRf] = useState(0.04);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function run() {
    setLoading(true); setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/portfolio-allocator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, capital, days, rf }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⚖️ Portfolio Allocator</h1>
        <p className="text-[var(--muted)] text-sm">
          Three allocation strategies side by side. Equal weight (naive), inverse-volatility (risk parity), Sharpe-weighted.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols (2-10)</label>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Capital ($)</label>
            <input type="number" value={capital} step={100}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={180}>180</option><option value={365}>365</option><option value={730}>730</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Risk-free %</label>
            <input type="number" value={rf * 100} step={0.1}
              onChange={(e) => setRf(Number(e.target.value) / 100)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Computing…" : "Allocate"}
            </button>
          </div>
        </div>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
            <h2 className="font-semibold text-sm mb-3">Per-symbol stats</h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)]">
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2 pr-3 text-right">Annual return</th>
                  <th className="py-2 pr-3 text-right">Annual vol</th>
                  <th className="py-2 pr-3 text-right">Sharpe</th>
                </tr>
              </thead>
              <tbody>
                {data.stats.map((s) => (
                  <tr key={s.symbol} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="py-2 pr-3 font-mono font-semibold">{s.symbol}</td>
                    <td className={`py-2 pr-3 text-right font-mono ${s.annual_return_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.annual_return_pct >= 0 ? "+" : ""}{s.annual_return_pct.toFixed(2)}%
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{s.annual_vol_pct.toFixed(2)}%</td>
                    <td className={`py-2 pr-3 text-right font-mono ${s.sharpe >= 1 ? "text-green-400" : s.sharpe >= 0 ? "text-amber-400" : "text-red-400"}`}>
                      {s.sharpe.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {([
              { title: "Equal weight", desc: "Naive 1/N.", allocs: data.allocations.equal_weight, color: "bg-indigo-700" },
              { title: "Inverse volatility", desc: "Risk parity. Less volatile = more weight.", allocs: data.allocations.inverse_vol, color: "bg-amber-700" },
              { title: "Sharpe-weighted", desc: "Higher Sharpe = more weight. Negative Sharpe = 0.", allocs: data.allocations.max_sharpe_proxy, color: "bg-green-700" },
            ] as const).map((strat) => (
              <div key={strat.title} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
                <h3 className="font-semibold text-sm">{strat.title}</h3>
                <p className="text-xs text-[var(--muted)] mb-3">{strat.desc}</p>
                <div className="space-y-1.5">
                  {strat.allocs.map((a) => (
                    <div key={a.symbol}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-mono font-semibold">{a.symbol}</span>
                        <span className="font-mono text-[var(--muted)]">{(a.weight * 100).toFixed(1)}% · ${a.dollars.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-[var(--background)] rounded overflow-hidden">
                        <div className={strat.color} style={{ width: `${a.weight * 100}%`, height: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Equal weight</strong>: simple, robust, no parameter tuning. Often beats fancier models out-of-sample.</p>
        <p><strong>Inverse vol</strong>: ray dalio risk parity foundation. Less risk concentration.</p>
        <p><strong>Sharpe-weighted</strong>: tilts to highest risk-adjusted returns. Overfits past period.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ All weights backward-looking. Past Sharpe ≠ future Sharpe. Rebalance regularly. Research only.</div>
    </div>
  );
}
