"use client";

import { useEffect, useState } from "react";

interface Score { currency: string; score: number; }

const FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
  CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿",
};

export default function CurrencyStrengthClient() {
  const [days, setDays] = useState(7);
  const [scores, setScores] = useState<Score[]>([]);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/currency-strength?days=${days}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else {
        setScores(j.scores);
        setPeriod({ start: j.start_date, end: j.end_date });
      }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [days]);

  const maxAbs = scores.length ? Math.max(...scores.map((s) => Math.abs(s.score))) : 1;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">💱 Currency Strength Meter</h1>
          <p className="text-[var(--muted)] text-sm">
            8-currency relative ranking. Strength = average % change vs other 7. ECB rates via Frankfurter.
          </p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
          <option value={1}>1d</option><option value={3}>3d</option>
          <option value={7}>7d</option><option value={14}>14d</option>
          <option value={30}>30d</option>
        </select>
      </div>

      {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {period && (
        <p className="text-xs text-[var(--muted)]">Period: {period.start} → {period.end}</p>
      )}

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 space-y-2">
        {scores.map((s, i) => {
          const pct = (Math.abs(s.score) / maxAbs) * 50;
          return (
            <div key={s.currency} className="flex items-center gap-3 text-sm">
              <span className="w-8 text-xs text-[var(--muted)]">#{i + 1}</span>
              <span className="w-20 font-mono font-bold">{FLAG[s.currency]} {s.currency}</span>
              <div className="flex-1 h-4 bg-[var(--background)] rounded relative overflow-hidden">
                <div className="absolute inset-y-0 left-1/2 w-px bg-gray-500" />
                <div
                  className={`absolute inset-y-0 ${s.score >= 0 ? "bg-green-500 left-1/2" : "bg-red-500 right-1/2"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`w-20 text-right font-mono font-semibold ${s.score >= 0 ? "text-green-400" : "text-red-400"}`}>
                {s.score >= 0 ? "+" : ""}{s.score.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Strongest</strong>: trade long against weakest (e.g. long GBP/JPY if GBP top, JPY bottom).</p>
        <p><strong>Diverging extremes</strong>: most actionable. Same-direction pairs lack momentum.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ ECB rates are daily fix prices. Intraday FX may diverge. Research only.</div>
    </div>
  );
}
