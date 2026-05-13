"use client";

import { useState } from "react";

interface Score {
  symbol: string;
  change_1d: number | null;
  change_5d: number | null;
  change_20d: number | null;
  change_60d: number | null;
  composite: number;
  rank: number;
}

const PRESETS: Record<string, string> = {
  "Mega tech": "AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA",
  "Top crypto": "BTC,ETH,SOL,XRP,DOGE,ADA,AVAX",
  "Index ETFs": "SPY,QQQ,IWM,DIA,VTI,VEA",
  "Sector ETFs": "XLK,XLF,XLE,XLV,XLY,XLI,XLP,XLU,XLB,XLRE",
};

function fmt(v: number | null) {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}
function color(v: number | null) {
  if (v == null) return "text-[var(--muted)]";
  return v >= 0 ? "text-green-400" : "text-red-400";
}

export default function StrengthMeterClient() {
  const [input, setInput] = useState("AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA,SPY,QQQ");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Score[]>([]);

  async function run() {
    setLoading(true);
    setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (symbols.length === 0) {
      setErr("Provide at least one symbol");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/strength-meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setResults(j.results ?? []);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">💪 Relative Strength Meter</h1>
        <p className="text-[var(--muted)] text-sm">
          Rank symbols by recent performance. Composite weights: 1d 40% · 5d 30% · 20d 20% · 60d 10%.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols (comma or space separated, max 30)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, syms]) => (
            <button
              key={name}
              onClick={() => setInput(syms)}
              className="text-xs bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded"
            >
              {name}
            </button>
          ))}
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Ranking…" : "Rank"}
        </button>
        {err && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr className="text-left border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3 text-right">Rank (0-100)</th>
                <th className="py-2 pr-3 text-right">1d</th>
                <th className="py-2 pr-3 text-right">5d</th>
                <th className="py-2 pr-3 text-right">20d</th>
                <th className="py-2 pr-3 text-right">60d</th>
                <th className="py-2 pr-3 text-right">Composite</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--muted)]">{i + 1}</td>
                  <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--background)] rounded overflow-hidden">
                        <div
                          className={`h-full ${r.composite >= 0 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${r.rank}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{r.rank}</span>
                    </div>
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${color(r.change_1d)}`}>{fmt(r.change_1d)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${color(r.change_5d)}`}>{fmt(r.change_5d)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${color(r.change_20d)}`}>{fmt(r.change_20d)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${color(r.change_60d)}`}>{fmt(r.change_60d)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${color(r.composite)}`}>
                    {r.composite.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Relative strength is a momentum measure, not a quality screen. Combine with fundamentals before sizing positions.
      </div>
    </div>
  );
}
