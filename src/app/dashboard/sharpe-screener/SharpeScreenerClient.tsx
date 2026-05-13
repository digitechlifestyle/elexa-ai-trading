"use client";

import { useState } from "react";

interface Row {
  symbol: string;
  n: number;
  mean_daily_pct: number;
  std_daily_pct: number;
  sharpe_annual: number;
  ann_return_pct: number;
  ann_vol_pct: number;
  max_drawdown_pct: number;
}

export default function SharpeScreenerClient() {
  const [symbolsInput, setSymbolsInput] = useState(
    "SPY,QQQ,IWM,DIA,GLD,SLV,TLT,BTC,ETH,XLF,XLK,XLE,XLV,AAPL,MSFT,NVDA"
  );
  const [days, setDays] = useState("180");
  const [rows, setRows] = useState<Row[]>([]);
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
      const res = await fetch("/api/sharpe-screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, days: Number(days) }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setRows(j.rows ?? []);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  function sharpeTone(s: number): string {
    if (s >= 1.5) return "text-green-400";
    if (s >= 0.5) return "text-lime-400";
    if (s >= 0) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Sharpe Screener</h1>
        <p className="text-[var(--muted)] text-sm">
          Rank a basket of symbols by Sharpe ratio. Find the best risk-adjusted
          returns over a lookback window.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbols (max 30)
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
              min={60}
              max={365}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold"
          >
            {loading ? "Screening…" : "Rank by Sharpe"}
          </button>
        </div>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-2 px-3">Rank</th>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Sharpe</th>
                  <th className="text-right py-2 px-3">Ann. return</th>
                  <th className="text-right py-2 px-3">Ann. vol</th>
                  <th className="text-right py-2 px-3">Max DD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.symbol}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-2 px-3 text-[var(--muted)] font-mono">
                      #{i + 1}
                    </td>
                    <td className="py-2 px-3 font-bold">{r.symbol}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${sharpeTone(r.sharpe_annual)}`}>
                      {r.sharpe_annual.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        r.ann_return_pct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {r.ann_return_pct >= 0 ? "+" : ""}
                      {r.ann_return_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-[var(--muted)]">
                      {r.ann_vol_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-red-400">
                      -{r.max_drawdown_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Sharpe penalises upside vol equally. Use Sortino for downside-only.
        Small samples = unstable Sharpe. Research only — not financial advice.
      </div>
    </div>
  );
}
