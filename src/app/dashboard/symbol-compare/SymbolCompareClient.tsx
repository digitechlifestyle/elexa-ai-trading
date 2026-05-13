"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

const COLORS = ["#818cf8", "#fb923c", "#10b981", "#ef4444", "#a78bfa", "#06b6d4"];

interface Summary { symbol: string; return_pct: number; bars: number; }

export default function SymbolCompareClient() {
  const [input, setInput] = useState("SPY,QQQ,BTC,GLD");
  const [days, setDays] = useState(180);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [series, setSeries] = useState<Record<string, number | string>[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    const syms = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (syms.length < 2) { setErr("Need at least 2 symbols"); setLoading(false); return; }
    try {
      const res = await fetch("/api/symbol-compare", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: syms, days }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); }
      else {
        setSeries(j.series); setSummary(j.summary); setSymbols(j.symbols);
      }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Symbol Compare</h1>
        <p className="text-[var(--muted)] text-sm">
          Overlay 2-6 symbols normalised to 100 at window start. See relative performance instantly.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols (2-6)</label>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={30}>30</option><option value={90}>90</option>
              <option value={180}>180</option><option value={365}>365</option>
              <option value={730}>730</option>
            </select>
          </div>
          <button onClick={run} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {loading ? "Loading…" : "Compare"}
          </button>
        </div>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {summary.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
            {summary.sort((a, b) => b.return_pct - a.return_pct).map((s, i) => (
              <div key={s.symbol} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
                <p className="text-xs flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ background: COLORS[symbols.indexOf(s.symbol)] }} />
                  <span className="font-mono font-semibold">{s.symbol}</span>
                </p>
                <p className={`text-xl font-bold font-mono ${s.return_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {s.return_pct >= 0 ? "+" : ""}{s.return_pct.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <ReferenceLine y={100} stroke="#6b7280" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                    formatter={(v) => [`${Number(v).toFixed(2)}`, ""]} />
                  <Legend />
                  {symbols.map((sym, i) => (
                    <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={1.5} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ All series start at 100 at window open. Research only.</div>
    </div>
  );
}
