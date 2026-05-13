"use client";

import { useState } from "react";

interface CorrData {
  symbols: string[];
  days: number;
  matrix: (number | null)[][];
}

function colorFor(v: number | null): string {
  if (v == null) return "bg-[var(--background)] text-[var(--muted)]";
  // -1 strong red → +1 strong green
  if (v > 0.75) return "bg-green-700 text-white";
  if (v > 0.5) return "bg-green-800 text-green-200";
  if (v > 0.25) return "bg-green-900/60 text-green-300";
  if (v > -0.25) return "bg-[var(--background)] text-[var(--muted)]";
  if (v > -0.5) return "bg-red-900/60 text-red-300";
  if (v > -0.75) return "bg-red-800 text-red-200";
  return "bg-red-700 text-white";
}

export default function CorrelationClient() {
  const [symbolsInput, setSymbolsInput] = useState(
    "AAPL,MSFT,NVDA,GOOGL,BTC,ETH,GLD,SPY,TLT,USO"
  );
  const [days, setDays] = useState("90");
  const [data, setData] = useState<CorrData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const symbols = symbolsInput
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);
      const res = await fetch("/api/correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, days: Number(days) }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json.error ?? "Failed");
      else setData(json);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🔗 Correlation Matrix</h1>
        <p className="text-[var(--muted)] text-sm">
          Pearson correlation of daily returns. -1 = perfectly opposite, 0 = no relation,
          +1 = move in sync. Diversification means picking pairs that are not green.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbols (comma- or space-separated, max 12)
          </label>
          <input
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={30}
              max={365}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold"
          >
            {loading ? "Computing…" : "Run"}
          </button>
        </div>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 overflow-x-auto">
          <p className="text-xs text-[var(--muted)] mb-3">
            {data.days}-day window. {data.symbols.length} symbols.
          </p>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2"></th>
                {data.symbols.map((s) => (
                  <th
                    key={s}
                    className="p-2 font-semibold text-[var(--foreground)]"
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.symbols.map((row, i) => (
                <tr key={row}>
                  <td className="p-2 font-semibold">{row}</td>
                  {data.symbols.map((_, j) => {
                    const v = data.matrix[i][j];
                    return (
                      <td
                        key={j}
                        className={`p-2 text-center font-mono ${colorFor(v)}`}
                        title={v == null ? "n/a" : v.toFixed(2)}
                      >
                        {v == null ? "—" : v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 text-xs text-[var(--muted)] mt-4 items-center">
            <span>-1</span>
            <div className="flex h-3 flex-1 max-w-xs">
              <span className="flex-1 bg-red-700" />
              <span className="flex-1 bg-red-800" />
              <span className="flex-1 bg-red-900/60" />
              <span className="flex-1 bg-[var(--background)] border-y border-[var(--card-border)]" />
              <span className="flex-1 bg-green-900/60" />
              <span className="flex-1 bg-green-800" />
              <span className="flex-1 bg-green-700" />
            </div>
            <span>+1</span>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Correlation is not causation. Relationships shift over time. Use for
        diversification checks, not directional bets. Research only.
      </div>
    </div>
  );
}
