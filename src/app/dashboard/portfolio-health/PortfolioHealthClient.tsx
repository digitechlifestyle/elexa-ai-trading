"use client";

import { useEffect, useState } from "react";

interface Check { name: string; score: number; weight: number; detail: string; }
interface Data {
  composite: number;
  grade: string; grade_color: string;
  checks: Check[];
  closed_trades: number;
}

export default function PortfolioHealthClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/portfolio-health");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Scoring portfolio…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">💯 Portfolio Health Score</h1>
        <p className="text-[var(--muted)] text-sm">
          Composite 0-100 across 8 dimensions: stats, discipline, diversification, activity.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
        <p className="text-xs text-[var(--muted)] mb-1">Composite score</p>
        <div className="flex items-baseline justify-center gap-3">
          <p className="text-6xl font-bold font-mono">{data.composite}</p>
          <p className={`text-4xl font-bold ${data.grade_color}`}>{data.grade}</p>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">Based on {data.closed_trades} closed trades</p>
      </div>

      <div className="space-y-2">
        {data.checks.map((c) => (
          <div key={c.name} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <div className="flex justify-between items-baseline gap-3 flex-wrap mb-2">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-[var(--muted)]">weight {(c.weight * 100).toFixed(0)}%</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[var(--background)] rounded overflow-hidden">
                <div className={`h-full ${
                  c.score >= 70 ? "bg-green-500" : c.score >= 40 ? "bg-amber-500" : "bg-red-500"
                }`} style={{ width: `${c.score}%` }} />
              </div>
              <span className="font-mono font-bold w-12 text-right">{c.score.toFixed(0)}</span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>A (≥85)</strong>: institutional-grade. Profitable with discipline + diversification.</p>
        <p><strong>B (70-85)</strong>: solid edge. Refine weakest dimension.</p>
        <p><strong>C (55-70)</strong>: marginal. Small sample, weak stats, or concentration risk.</p>
        <p><strong>D-F (&lt;55)</strong>: needs work. Focus on journaling, win rate, profit factor.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Score reflects observable habits. Doesn&apos;t replace judgment. Research only.</div>
    </div>
  );
}
