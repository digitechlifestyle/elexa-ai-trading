"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Point { date: string; spread: number; z: number; }

export default function PairsTradeClient() {
  const [a, setA] = useState("KO");
  const [b, setB] = useState("PEP");
  const [days, setDays] = useState(180);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{
    correlation: number; beta: number; current_z: number; signal: string;
    series: Point[];
  } | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/pairs-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol_a: a.toUpperCase(), symbol_b: b.toUpperCase(), days }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⚖️ Pairs Trade Analyser</h1>
        <p className="text-[var(--muted)] text-sm">
          Statistical arbitrage between two correlated symbols. Spread z-score signals mean reversion entries.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol A</label>
            <input value={a} onChange={(e) => setA(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol B</label>
            <input value={b} onChange={(e) => setB(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={90}>90</option><option value={180}>180</option><option value={365}>365</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {loading ? "Analysing…" : "Analyse"}
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">Good pairs: KO/PEP, V/MA, XOM/CVX, GLD/SLV.</p>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <Stat label="Correlation" value={data.correlation.toFixed(3)}
              color={data.correlation > 0.7 ? "text-green-400" : data.correlation > 0.4 ? "text-amber-400" : "text-red-400"} />
            <Stat label="Hedge β" value={data.beta.toFixed(3)} />
            <Stat label="Current z" value={data.current_z.toFixed(2)}
              color={Math.abs(data.current_z) > 2 ? "text-amber-400" : ""} />
            <Stat label="Signal" value={data.signal} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">Spread z-score</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={data.series}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#6b7280" />
                  <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "+2σ", fill: "#ef4444", fontSize: 10 }} />
                  <ReferenceLine y={-2} stroke="#10b981" strokeDasharray="3 3" label={{ value: "-2σ", fill: "#10b981", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                    formatter={(v) => [`${Number(v).toFixed(2)}`, "z"]} />
                  <Line type="monotone" dataKey="z" stroke="#fb923c" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>z &gt; +2:</strong> A overpriced vs B → short A, long B.</p>
        <p><strong>z &lt; -2:</strong> A underpriced vs B → long A, short B.</p>
        <p><strong>|z| &lt; 0.5:</strong> mean reverted — close position.</p>
        <p>Pre-req: correlation &gt; 0.7. Lower = unreliable mean reversion.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Pairs can decouple permanently (corporate actions, regime change). Use stops on spread divergence. Research only.
      </div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
