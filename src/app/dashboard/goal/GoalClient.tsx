"use client";

import { useEffect, useState } from "react";

interface Goal {
  starting_capital: number;
  target_pct: number;
  target_date: string;
  started_at: string;
}

interface Data {
  goal: Goal | null;
  realised_pnl: number;
  pnl_since_start?: number;
  return_pct?: number;
  progress_pct?: number;
  time_progress_pct?: number;
  days_remaining?: number;
  on_pace?: boolean;
  required_pace_per_day?: number;
  trades_since_start?: number;
}

export default function GoalClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [startCap, setStartCap] = useState(10000);
  const [targetPct, setTargetPct] = useState(20);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/goal");
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  async function save() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/goal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_capital: startCap, target_pct: targetPct, target_date: targetDate }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else await load();
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  async function clear() {
    if (!confirm("Clear your goal?")) return;
    setBusy(true);
    await fetch("/api/goal", { method: "DELETE" });
    await load();
    setBusy(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading goal…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎯 Goal Tracker</h1>
        <p className="text-[var(--muted)] text-sm">
          Set a target return + deadline. Track progress vs time elapsed.
        </p>
      </div>

      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {data?.goal ? (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-baseline flex-wrap gap-2">
              <h2 className="font-semibold">Active goal</h2>
              <button onClick={clear} disabled={busy}
                className="text-xs text-red-400 hover:text-red-300">Clear goal</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <Stat label="Starting capital" value={`$${data.goal.starting_capital.toLocaleString()}`} />
              <Stat label="Target return" value={`${data.goal.target_pct >= 0 ? "+" : ""}${data.goal.target_pct}%`} />
              <Stat label="Target date" value={data.goal.target_date} />
              <Stat label="Days remaining" value={`${data.days_remaining ?? 0}`}
                color={(data.days_remaining ?? 0) < 30 ? "text-amber-400" : ""} />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted)]">Progress</span>
                <span className="font-mono">
                  {data.return_pct?.toFixed(2)}% / {data.goal.target_pct}% target
                </span>
              </div>
              <div className="h-4 bg-[var(--background)] rounded overflow-hidden relative">
                <div className={`h-full ${(data.progress_pct ?? 0) >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, data.progress_pct ?? 0))}%` }} />
                <div className="absolute inset-y-0 w-px bg-amber-400"
                  style={{ left: `${Math.min(100, data.time_progress_pct ?? 0)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 text-[var(--muted)]">
                <span>{(data.progress_pct ?? 0).toFixed(1)}% of target</span>
                <span>⏱ {(data.time_progress_pct ?? 0).toFixed(1)}% of time</span>
              </div>
            </div>

            <div className={`rounded-lg p-3 text-sm ${
              data.on_pace ? "bg-green-950 border border-green-700 text-green-300" : "bg-amber-950 border border-amber-700 text-amber-300"
            }`}>
              {data.on_pace ? "✅ On pace — keep going" : "⚠️ Behind pace — need to accelerate"}
              <p className="text-xs mt-1 opacity-90">
                Required pace: ~{data.required_pace_per_day?.toFixed(3)}% per day · {data.trades_since_start} trades since goal start
              </p>
            </div>

            <Stat label="P&L since goal started" value={`${(data.pnl_since_start ?? 0) >= 0 ? "+" : ""}$${(data.pnl_since_start ?? 0).toFixed(2)}`}
              color={(data.pnl_since_start ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold text-sm mb-3">Replace goal</h2>
            <GoalForm startCap={startCap} setStartCap={setStartCap}
              targetPct={targetPct} setTargetPct={setTargetPct}
              targetDate={targetDate} setTargetDate={setTargetDate}
              busy={busy} onSubmit={save} />
          </div>
        </>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <p className="text-sm text-[var(--muted)]">No goal set. Define one below.</p>
          <GoalForm startCap={startCap} setStartCap={setStartCap}
            targetPct={targetPct} setTargetPct={setTargetPct}
            targetDate={targetDate} setTargetDate={setTargetDate}
            busy={busy} onSubmit={save} />
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Goal tracker uses realised P&L from closed paper trades after goal start. Open positions excluded.
      </div>
    </div>
  );
}

function GoalForm({
  startCap, setStartCap, targetPct, setTargetPct, targetDate, setTargetDate, busy, onSubmit,
}: {
  startCap: number; setStartCap: (n: number) => void;
  targetPct: number; setTargetPct: (n: number) => void;
  targetDate: string; setTargetDate: (s: string) => void;
  busy: boolean; onSubmit: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field label="Starting capital ($)">
        <input type="number" value={startCap} step={100}
          onChange={(e) => setStartCap(Number(e.target.value))}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
      </Field>
      <Field label="Target return %">
        <input type="number" value={targetPct} step={1}
          onChange={(e) => setTargetPct(Number(e.target.value))}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
      </Field>
      <Field label="Target date">
        <input type="date" value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm" />
      </Field>
      <div className="sm:col-span-3">
        <button onClick={onSubmit} disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
          {busy ? "Saving…" : "Save goal"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      {children}
    </div>
  );
}
function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
