"use client";

import { useEffect, useState } from "react";

interface Sector {
  symbol: string; name: string; error?: boolean;
  price?: number | null;
  d1?: number | null; d5?: number | null; d20?: number | null;
  d60?: number | null; d90?: number | null;
}

const PERIODS = [
  { key: "d1", label: "1d" },
  { key: "d5", label: "5d" },
  { key: "d20", label: "20d" },
  { key: "d60", label: "60d" },
  { key: "d90", label: "90d" },
] as const;

type Period = typeof PERIODS[number]["key"];

export default function SectorLadderClient() {
  const [data, setData] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<Period>("d20");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sector-ladder");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j.sectors);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading sector data…</div>;
  if (err) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  const valid = data.filter((s) => !s.error);
  const sorted = [...valid].sort((a, b) => (b[sortBy] ?? -999) - (a[sortBy] ?? -999));
  const maxAbs = Math.max(...valid.flatMap((s) => PERIODS.map((p) => Math.abs(s[p.key] ?? 0))), 1);

  function fmt(v: number | null | undefined): string {
    if (v == null) return "—";
    return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  }
  function color(v: number | null | undefined): string {
    if (v == null) return "text-[var(--muted)]";
    return v >= 0 ? "text-green-400" : "text-red-400";
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🪜 Sector Performance Ladder</h1>
          <p className="text-[var(--muted)] text-sm">
            S&P 500 sector ETFs ranked by performance. Compare against SPY benchmark.
          </p>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as Period)}
          className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
          {PERIODS.map((p) => <option key={p.key} value={p.key}>Sort by {p.label}</option>)}
        </select>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr className="text-left border-b border-[var(--card-border)]">
              <th className="py-2 pr-3">Sector</th>
              <th className="py-2 pr-3 text-right">Price</th>
              {PERIODS.map((p) => (
                <th key={p.key} className={`py-2 pr-3 text-right ${sortBy === p.key ? "text-white" : ""}`}>{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const isBenchmark = s.symbol === "SPY";
              return (
                <tr key={s.symbol} className={`border-b border-[var(--card-border)] last:border-0 ${isBenchmark ? "bg-indigo-950/30" : ""}`}>
                  <td className="py-2 pr-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold">{s.symbol}</span>
                      <span className="text-xs text-[var(--muted)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">${s.price?.toFixed(2) ?? "—"}</td>
                  {PERIODS.map((p) => {
                    const v = s[p.key];
                    const width = v != null ? (Math.abs(v) / maxAbs) * 100 : 0;
                    return (
                      <td key={p.key} className="py-2 pr-3 text-right relative">
                        <div className={`font-mono ${color(v)}`}>{fmt(v)}</div>
                        {v != null && (
                          <div className={`absolute bottom-0 ${v >= 0 ? "left-1/2 bg-green-500/30" : "right-1/2 bg-red-500/30"} h-1`}
                            style={{ width: `${width / 2}%` }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Rotation play:</strong> sectors outperforming SPY across short + long windows = leadership.</p>
        <p><strong>Defensive regime:</strong> XLP, XLU, XLV leading = risk-off rotation.</p>
        <p><strong>Risk-on regime:</strong> XLK, XLY, XLC leading = growth/discretionary in favour.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Sector momentum lags 1-2 weeks. Research only.</div>
    </div>
  );
}
