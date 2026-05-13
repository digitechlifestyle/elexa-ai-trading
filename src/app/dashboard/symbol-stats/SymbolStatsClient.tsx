"use client";

import { useState } from "react";

interface Data {
  symbol: string; days: number;
  first_price: number; last_price: number;
  total_return: number; cagr: number;
  annual_vol: number; sharpe: number; sortino: number; calmar: number;
  max_drawdown: number;
  peak_date: string; trough_date: string;
  daily_win_rate: number; risk_free_rate: number;
}

export default function SymbolStatsClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [days, setDays] = useState(365);
  const [rf, setRf] = useState(0.04);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/symbol-stats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), days, rf }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Symbol Stats</h1>
        <p className="text-[var(--muted)] text-sm">
          CAGR, Sharpe, Sortino, Calmar, max drawdown — institutional-grade single-asset metrics.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Risk-free %</label>
            <input type="number" value={rf * 100} step={0.1}
              onChange={(e) => setRf(Number(e.target.value) / 100)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <Stat label="Total return" value={`${data.total_return >= 0 ? "+" : ""}${data.total_return.toFixed(2)}%`}
              color={data.total_return >= 0 ? "text-green-400" : "text-red-400"} />
            <Stat label="CAGR" value={`${data.cagr >= 0 ? "+" : ""}${data.cagr.toFixed(2)}%`}
              color={data.cagr >= 0 ? "text-green-400" : "text-red-400"} />
            <Stat label="Annual vol" value={`${data.annual_vol.toFixed(2)}%`} />
            <Stat label="Max drawdown" value={`${data.max_drawdown.toFixed(2)}%`} color="text-red-400" />
            <Stat label="Sharpe" value={data.sharpe.toFixed(2)}
              color={data.sharpe >= 1 ? "text-green-400" : data.sharpe >= 0 ? "text-amber-400" : "text-red-400"} />
            <Stat label="Sortino" value={data.sortino.toFixed(2)}
              color={data.sortino >= 1 ? "text-green-400" : data.sortino >= 0 ? "text-amber-400" : "text-red-400"} />
            <Stat label="Calmar" value={data.calmar.toFixed(2)}
              color={data.calmar >= 0.5 ? "text-green-400" : "text-amber-400"} />
            <Stat label="Daily win rate" value={`${data.daily_win_rate.toFixed(1)}%`} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
            <Row label="Price range" value={`$${data.first_price.toFixed(2)} → $${data.last_price.toFixed(2)}`} />
            <Row label="Peak date" value={data.peak_date} />
            <Row label="Drawdown trough" value={data.trough_date} color="text-red-400" />
            <Row label="Risk-free rate used" value={`${data.risk_free_rate.toFixed(2)}%`} />
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Sharpe</strong>: risk-adjusted return. &gt;1 good, &gt;2 great, &gt;3 elite.</p>
        <p><strong>Sortino</strong>: penalises only downside vol. Better for skewed strategies.</p>
        <p><strong>Calmar</strong>: CAGR / |max DD|. &gt;0.5 = decent, &gt;1 = strong.</p>
        <p><strong>Max DD</strong>: worst peak-to-trough. Sets your psychological survival ceiling.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Past performance ≠ future. Window-dependent. Research only.</div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
function Row({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}
