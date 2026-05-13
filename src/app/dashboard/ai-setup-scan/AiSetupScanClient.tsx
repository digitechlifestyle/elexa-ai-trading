"use client";

import { useState } from "react";

interface Ranked { symbol: string; score: number; bias: string; thesis: string; }

export default function AiSetupScanClient() {
  const [input, setInput] = useState("AAPL,MSFT,NVDA,SPY,QQQ");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ranked, setRanked] = useState<Ranked[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 10);
    try {
      const res = await fetch("/api/ai-setup-scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setRanked([]); }
      else setRanked(j.ranked ?? []);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  function biasColor(b: string) {
    if (b === "long") return "text-green-400";
    if (b === "short") return "text-red-400";
    return "text-amber-400";
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🤖 AI Setup Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          Claude ranks setup quality across symbols. Combines trend, momentum, RSI, MA alignment, and risk-reward intuition.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols (max 10)</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <button onClick={run} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
          {loading ? "Claude is thinking…" : "Rank setups"}
        </button>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {ranked.length > 0 && (
        <div className="space-y-3">
          {ranked.map((r, i) => (
            <div key={r.symbol} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-full w-7 h-7 flex items-center justify-center font-bold">#{i + 1}</span>
                  <span className="font-mono font-bold text-lg">{r.symbol}</span>
                  <span className={`text-sm font-bold uppercase ${biasColor(r.bias)}`}>{r.bias}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[var(--background)] rounded overflow-hidden">
                    <div className={`h-full ${r.score >= 70 ? "bg-green-500" : r.score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="text-sm font-mono font-bold w-10 text-right">{r.score}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{r.thesis}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ AI rankings reflect indicator alignment, not certainty. Confirm with chart context + your risk plan. Research only.
      </div>
    </div>
  );
}
