"use client";

import { useState } from "react";

interface TestResult { name: string; pass: boolean; }
interface Data {
  symbol: string; price: number; score: number; label: string; color: string;
  passed: number; total: number; tests: TestResult[];
  ema20: number; sma50: number; sma100: number; sma200: number;
}

export default function TrendScoreClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/trend-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setData(null); }
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Trend Score</h1>
        <p className="text-[var(--muted)] text-sm">
          8-test multi-MA alignment scorer. Score from -1 (strong down) to +1 (strong up).
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex gap-2">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)}
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={run} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {loading ? "Scoring…" : "Score"}
          </button>
        </div>
        {err && <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Trend regime</p>
            <p className={`text-3xl font-bold ${data.color}`}>{data.label}</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Score: <span className="font-mono font-semibold">{data.score.toFixed(2)}</span> · {data.passed}/{data.total} tests passed
            </p>
            <div className="mt-4 h-3 bg-[var(--background)] rounded relative overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-500" />
              <div
                className={`absolute inset-y-0 ${data.score >= 0 ? "bg-green-500 left-1/2" : "bg-red-500 right-1/2"}`}
                style={{ width: `${Math.abs(data.score) * 50}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
              <span>-1</span><span>0</span><span>+1</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <Stat label="Price" value={`$${data.price.toFixed(2)}`} />
            <Stat label="EMA 20" value={`$${data.ema20.toFixed(2)}`} />
            <Stat label="SMA 50" value={`$${data.sma50.toFixed(2)}`} />
            <Stat label="SMA 100" value={`$${data.sma100.toFixed(2)}`} />
            <Stat label="SMA 200" value={`$${data.sma200.toFixed(2)}`} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold text-sm mb-3">Test breakdown</h2>
            <ul className="space-y-1.5">
              {data.tests.map((t) => (
                <li key={t.name} className="flex justify-between items-center text-sm border-b border-[var(--card-border)] last:border-0 py-1.5">
                  <span>{t.name}</span>
                  <span className={t.pass ? "text-green-400" : "text-red-400"}>{t.pass ? "✅" : "❌"}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Trend score lags — confirms regime, doesn&apos;t predict turns. Research only.</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-base font-bold font-mono">{value}</p>
    </div>
  );
}
