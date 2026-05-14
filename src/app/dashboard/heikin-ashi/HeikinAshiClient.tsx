"use client";

import { useState } from "react";

interface HaBar { t: string; o: number; h: number; l: number; c: number; bullish: boolean; }
interface Data {
  symbol: string;
  last: HaBar & { body_pct: number; upper_wick: number; lower_wick: number };
  streak: number;
  direction: "up" | "down";
  signal: string; color: string;
  strong_trend: boolean;
  series: HaBar[];
}

export default function HeikinAshiClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/heikin-ashi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
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
        <h1 className="text-2xl font-bold mb-1">🕯️ Heikin-Ashi Snapshot</h1>
        <p className="text-[var(--muted)] text-sm">
          Smoothed candles filter noise. Consecutive same-colour candles signal trend strength.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex gap-2">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={run} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {loading ? "Computing…" : "Compute"}
          </button>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Heikin-Ashi signal</p>
            <p className={`text-3xl font-bold ${data.color}`}>{data.signal}</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              <span className={data.direction === "up" ? "text-green-400" : "text-red-400"}>
                {data.streak} consecutive {data.direction === "up" ? "green" : "red"} candle{data.streak > 1 ? "s" : ""}
              </span>
              {data.strong_trend && " · strong body, minimal opposing wick"}
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3">Last 60 HA candles</h2>
            <div className="flex gap-0.5 items-end h-48 overflow-hidden">
              {data.series.map((b) => {
                const min = Math.min(...data.series.map((x) => x.l));
                const max = Math.max(...data.series.map((x) => x.h));
                const range = max - min || 1;
                const bodyTop = Math.max(b.o, b.c);
                const bodyBottom = Math.min(b.o, b.c);
                const topY = ((max - b.h) / range) * 100;
                const bodyTopY = ((max - bodyTop) / range) * 100;
                const bodyBottomY = ((max - bodyBottom) / range) * 100;
                const bottomY = ((max - b.l) / range) * 100;
                return (
                  <div key={b.t} className="flex-1 relative min-w-[3px]" style={{ height: "100%" }}>
                    <div className={`absolute left-1/2 w-px ${b.bullish ? "bg-green-500" : "bg-red-500"}`}
                      style={{ top: `${topY}%`, bottom: `${100 - bottomY}%` }} />
                    <div className={`absolute left-0 right-0 ${b.bullish ? "bg-green-500" : "bg-red-500"}`}
                      style={{ top: `${bodyTopY}%`, height: `${Math.max(1, bodyBottomY - bodyTopY)}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Long streak of green/red:</strong> persistent trend, hold positions.</p>
        <p><strong>No-wick candle in trend direction:</strong> strongest trend signal.</p>
        <p><strong>Small body with wicks both sides:</strong> potential reversal.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Heikin-Ashi lags real prices. Use real candle close for entries/exits. Research only.</div>
    </div>
  );
}
