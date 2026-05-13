"use client";

import { useEffect, useState } from "react";

interface Indicator { name: string; value: number | null; signal: number; desc: string; }
interface Data {
  regime: string; color: string; score: number; max: number;
  period_days: number; indicators: Indicator[];
}

export default function RiskRegimeClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/risk-regime");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Computing regime…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🌡️ Risk-On / Risk-Off</h1>
        <p className="text-[var(--muted)] text-sm">
          7-indicator composite over last {data.period_days} days. Stocks + credit + crypto vs safe-haven flows.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
        <p className="text-xs text-[var(--muted)] mb-1">Composite</p>
        <p className={`text-4xl font-bold ${data.color}`}>{data.regime}</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          Score <span className="font-mono font-semibold">{data.score > 0 ? "+" : ""}{data.score}</span> / ±{data.max}
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold text-sm mb-3">Indicator breakdown</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr className="text-left border-b border-[var(--card-border)]">
              <th className="py-2 pr-3">Indicator</th>
              <th className="py-2 pr-3 text-right">{data.period_days}d %</th>
              <th className="py-2 pr-3 text-center">Signal</th>
              <th className="py-2 pr-3">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {data.indicators.map((i) => (
              <tr key={i.name} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3 font-semibold">{i.name}</td>
                <td className={`py-2 pr-3 text-right font-mono ${(i.value ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {i.value != null ? `${i.value >= 0 ? "+" : ""}${i.value.toFixed(2)}%` : "—"}
                </td>
                <td className="py-2 pr-3 text-center">
                  {i.signal === 1 ? <span className="text-green-400 font-bold">ON</span>
                    : i.signal === -1 ? <span className="text-red-400 font-bold">OFF</span>
                    : <span className="text-[var(--muted)]">—</span>}
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--muted)]">{i.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Risk ON</strong>: stocks + credit + crypto rallying, safe havens dumped. Add risk.</p>
        <p><strong>Risk OFF</strong>: safe havens bid, stocks under pressure. De-risk, hedge.</p>
        <p><strong>Mixed</strong>: indicators conflict — wait for clarity.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Short-window snapshot. Not a market call. Research only.</div>
    </div>
  );
}
