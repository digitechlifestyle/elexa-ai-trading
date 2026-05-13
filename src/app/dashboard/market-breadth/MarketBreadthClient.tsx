"use client";

import { useEffect, useState } from "react";

interface Row {
  symbol: string;
  price: number | null;
  change_pct: number | null;
  above50: boolean | null;
  above200: boolean | null;
}

interface Data {
  advancers: number;
  decliners: number;
  unchanged: number;
  ad_ratio: number | null;
  pct_above_50: number;
  pct_above_200: number;
  universe_size: number;
  rows: Row[];
}

export default function MarketBreadthClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/market-breadth");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch {
        setErr("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Computing breadth across 50 large caps…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  const totalValid = data.advancers + data.decliners + data.unchanged;
  const advPct = (data.advancers / totalValid) * 100;
  const decPct = (data.decliners / totalValid) * 100;

  const tone =
    data.pct_above_200 > 70 && data.pct_above_50 > 60 ? { label: "Strong bull", color: "text-green-400" } :
    data.pct_above_200 > 50 ? { label: "Bullish", color: "text-green-300" } :
    data.pct_above_200 > 30 ? { label: "Neutral", color: "text-amber-400" } :
    { label: "Bearish", color: "text-red-400" };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🫁 Market Breadth</h1>
        <p className="text-[var(--muted)] text-sm">
          How wide is the move? Strong rallies have wide participation. Narrow breadth = fragile.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Regime" value={tone.label} color={tone.color} />
        <Stat label="A/D ratio" value={data.ad_ratio != null ? data.ad_ratio.toFixed(2) : "—"}
          color={data.ad_ratio != null && data.ad_ratio > 1 ? "text-green-400" : "text-red-400"} />
        <Stat label="% above 50 MA" value={`${data.pct_above_50.toFixed(0)}%`}
          color={data.pct_above_50 > 50 ? "text-green-400" : "text-red-400"} />
        <Stat label="% above 200 MA" value={`${data.pct_above_200.toFixed(0)}%`}
          color={data.pct_above_200 > 50 ? "text-green-400" : "text-red-400"} />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Today&apos;s participation</h2>
        <div className="flex h-6 rounded overflow-hidden mb-3">
          <div className="bg-green-500" style={{ width: `${advPct}%` }} title={`${data.advancers} advancers`} />
          <div className="bg-gray-600" style={{ width: `${(data.unchanged / totalValid) * 100}%` }} title={`${data.unchanged} unchanged`} />
          <div className="bg-red-500" style={{ width: `${decPct}%` }} title={`${data.decliners} decliners`} />
        </div>
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span className="text-green-400">{data.advancers} advancers ({advPct.toFixed(0)}%)</span>
          <span>{data.unchanged} unchanged</span>
          <span className="text-red-400">{data.decliners} decliners ({decPct.toFixed(0)}%)</span>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Universe ({data.universe_size} large caps)</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr className="text-left border-b border-[var(--card-border)]">
              <th className="py-2 pr-3">Symbol</th>
              <th className="py-2 pr-3 text-right">Price</th>
              <th className="py-2 pr-3 text-right">1d %</th>
              <th className="py-2 pr-3 text-center">&gt; 50 MA</th>
              <th className="py-2 pr-3 text-center">&gt; 200 MA</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-1.5 pr-3 font-mono font-semibold">{r.symbol}</td>
                <td className="py-1.5 pr-3 text-right font-mono">{r.price != null ? `$${r.price.toFixed(2)}` : "—"}</td>
                <td className={`py-1.5 pr-3 text-right font-mono ${(r.change_pct ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {r.change_pct != null ? `${r.change_pct >= 0 ? "+" : ""}${r.change_pct.toFixed(2)}%` : "—"}
                </td>
                <td className="py-1.5 pr-3 text-center">{r.above50 == null ? "—" : r.above50 ? "✅" : "❌"}</td>
                <td className="py-1.5 pr-3 text-center">{r.above200 == null ? "—" : r.above200 ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Sample of 50 large caps, not full S&amp;P. Directionally accurate. Research only.</div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
