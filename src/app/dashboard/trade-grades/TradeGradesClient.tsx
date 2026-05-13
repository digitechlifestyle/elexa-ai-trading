"use client";

import { useEffect, useState } from "react";

interface Graded {
  symbol: string; qty: number;
  entry_price: number; exit_price: number;
  entry_time: string; exit_time: string;
  pnl: number; return_pct: number; hold_hours: number;
  grade: "A" | "B" | "C" | "D" | "F";
  score: number; notes: string[];
}

const GRADE_COLOR: Record<Graded["grade"], string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500/70 text-white",
  C: "bg-amber-500 text-black",
  D: "bg-orange-500 text-white",
  F: "bg-red-600 text-white",
};

export default function TradeGradesClient() {
  const [data, setData] = useState<{ trades: Graded[]; distribution: Record<string, number>; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/trade-grades");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Grading trades…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  if (data.total === 0) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">🎓 Trade Quality Grader</h1>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--muted)]">No closed trades to grade yet.</div>
      </div>
    );
  }

  const total = data.total;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎓 Trade Quality Grader</h1>
        <p className="text-[var(--muted)] text-sm">
          Each closed trade scored on return + hold time + dust penalty. A = clean execution, F = setup needs review.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {(["A", "B", "C", "D", "F"] as const).map((g) => (
          <div key={g} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${GRADE_COLOR[g]}`}>{g}</div>
            <p className="text-2xl font-bold mt-2 font-mono">{data.distribution[g] ?? 0}</p>
            <p className="text-xs text-[var(--muted)]">{(((data.distribution[g] ?? 0) / total) * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold text-sm mb-3">Recent trades (newest first, max 100)</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr className="text-left border-b border-[var(--card-border)]">
              <th className="py-2 pr-3">Grade</th>
              <th className="py-2 pr-3">Symbol</th>
              <th className="py-2 pr-3 text-right">P&L</th>
              <th className="py-2 pr-3 text-right">Return</th>
              <th className="py-2 pr-3 text-right">Hold</th>
              <th className="py-2 pr-3">Exited</th>
              <th className="py-2 pr-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.trades.map((t, i) => (
              <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-2 pr-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${GRADE_COLOR[t.grade]}`}>{t.grade}</span>
                </td>
                <td className="py-2 pr-3 font-mono font-semibold">{t.symbol}</td>
                <td className={`py-2 pr-3 text-right font-mono ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                </td>
                <td className={`py-2 pr-3 text-right font-mono ${t.return_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {t.return_pct >= 0 ? "+" : ""}{t.return_pct.toFixed(2)}%
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs">
                  {t.hold_hours < 1 ? `${(t.hold_hours * 60).toFixed(0)}m` :
                   t.hold_hours < 24 ? `${t.hold_hours.toFixed(1)}h` :
                   `${(t.hold_hours / 24).toFixed(1)}d`}
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--muted)] font-mono">
                  {new Date(t.exit_time).toISOString().slice(0, 10)}
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--muted)]">{t.notes.join("; ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Grading uses return + hold heuristics. Doesn&apos;t know your stop or thesis. Research only.</div>
    </div>
  );
}
