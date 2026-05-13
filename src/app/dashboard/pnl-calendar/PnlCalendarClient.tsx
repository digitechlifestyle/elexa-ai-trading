"use client";

import { useEffect, useState } from "react";

interface Data {
  year: number;
  daily: Record<string, { pnl: number; trades: number }>;
  summary: {
    total_pnl: number;
    winning_days: number;
    losing_days: number;
    best_day: { date: string; pnl: number } | null;
    worst_day: { date: string; pnl: number } | null;
  };
}

function intensity(pnl: number, max: number): string {
  if (pnl === 0) return "bg-[var(--background)]";
  const r = Math.min(1, Math.abs(pnl) / max);
  if (pnl > 0) {
    if (r > 0.75) return "bg-green-600";
    if (r > 0.5) return "bg-green-500";
    if (r > 0.25) return "bg-green-700/70";
    return "bg-green-900";
  }
  if (r > 0.75) return "bg-red-600";
  if (r > 0.5) return "bg-red-500";
  if (r > 0.25) return "bg-red-700/70";
  return "bg-red-900";
}

export default function PnlCalendarClient() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/pnl-calendar?year=${year}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [year]);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading calendar…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  const maxAbs = Math.max(
    1,
    ...Object.values(data.daily).map((d) => Math.abs(d.pnl)),
  );

  // Build year grid: 53 weeks × 7 days
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T00:00:00Z`);
  const cells: { date: string; pnl: number; trades: number }[] = [];
  // Pad to start of week (Sunday = 0)
  const startWeekday = start.getUTCDay();
  for (let i = 0; i < startWeekday; i++) cells.push({ date: "", pnl: 0, trades: 0 });
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const v = data.daily[iso];
    cells.push({ date: iso, pnl: v?.pnl ?? 0, trades: v?.trades ?? 0 });
  }

  // Group into weeks (columns)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">📅 P&L Calendar</h1>
          <p className="text-[var(--muted)] text-sm">
            Daily realised P&L heatmap, GitHub-style. Green = winning day, red = losing day. Intensity = magnitude.
          </p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Stat label="Total P&L" value={`${data.summary.total_pnl >= 0 ? "+" : ""}$${data.summary.total_pnl.toFixed(2)}`}
          color={data.summary.total_pnl >= 0 ? "text-green-400" : "text-red-400"} />
        <Stat label="Winning days" value={data.summary.winning_days.toString()} color="text-green-400" />
        <Stat label="Losing days" value={data.summary.losing_days.toString()} color="text-red-400" />
        <Stat label="Best day" value={data.summary.best_day ? `+$${data.summary.best_day.pnl.toFixed(0)}` : "—"} color="text-green-400" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, ci) => (
                <div
                  key={ci}
                  className={`w-3 h-3 rounded-sm ${cell.date ? intensity(cell.pnl, maxAbs) : "opacity-0"}`}
                  title={cell.date ? `${cell.date}: ${cell.pnl >= 0 ? "+" : ""}$${cell.pnl.toFixed(2)} · ${cell.trades} trades` : ""}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2 items-center text-xs text-[var(--muted)]">
          <span>Less</span>
          <div className="w-3 h-3 bg-red-600 rounded-sm" />
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
          <div className="w-3 h-3 bg-red-700/70 rounded-sm" />
          <div className="w-3 h-3 bg-[var(--background)] rounded-sm" />
          <div className="w-3 h-3 bg-green-900 rounded-sm" />
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <div className="w-3 h-3 bg-green-600 rounded-sm" />
          <span>More</span>
          <span className="ml-auto">{Object.keys(data.daily).length} active days · max |day| = ${maxAbs.toFixed(0)}</span>
        </div>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ P&L from FIFO matching of closed trades only. Year is UTC. Research only.</div>
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
