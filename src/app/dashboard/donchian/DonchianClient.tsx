"use client";

import { useState } from "react";

interface Row {
  symbol: string;
  error?: boolean;
  price?: number;
  high_n?: number;
  low_n?: number;
  signal?: "buy" | "sell" | "none";
  pct_to_high?: number;
  pct_to_low?: number;
}

export default function DonchianClient() {
  const [input, setInput] = useState("AAPL,MSFT,NVDA,GOOGL,META,AMZN,TSLA,SPY,QQQ,IWM,GLD,TLT");
  const [period, setPeriod] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  async function run() {
    setLoading(true); setErr(null);
    const symbols = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/donchian", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, period }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setRows([]); }
      else setRows(j.results);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const valid = rows.filter((r) => !r.error);
  const buys = valid.filter((r) => r.signal === "buy");
  const sells = valid.filter((r) => r.signal === "sell");
  const sorted = [...valid].sort((a, b) =>
    (a.signal === "buy" ? -2 : a.signal === "sell" ? -1 : 0) -
    (b.signal === "buy" ? -2 : b.signal === "sell" ? -1 : 0)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🐢 Donchian Breakout Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          Turtle Trading system. Close above N-day high = buy signal. Close below N-day low = sell signal.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <label className="block text-xs text-[var(--muted)]">Symbols</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Period</label>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value={10}>10 (short)</option>
              <option value={20}>20 (Turtle entry)</option>
              <option value={55}>55 (Turtle long-term)</option>
            </select>
          </div>
          <button onClick={run} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>
        {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      </div>

      {valid.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Breakouts ↑" value={buys.length.toString()} color="text-green-400" />
          <Stat label="Breakdowns ↓" value={sells.length.toString()} color="text-red-400" />
          <Stat label="No signal" value={(valid.length - buys.length - sells.length).toString()} />
        </div>
      )}

      {valid.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr className="text-left border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3 text-right">Price</th>
                <th className="py-2 pr-3 text-right">{period}d high</th>
                <th className="py-2 pr-3 text-right">{period}d low</th>
                <th className="py-2 pr-3 text-right">To high</th>
                <th className="py-2 pr-3 text-right">To low</th>
                <th className="py-2 pr-3">Signal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.symbol} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold">{r.symbol}</td>
                  <td className="py-2 pr-3 text-right font-mono">${r.price?.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${r.high_n?.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${r.low_n?.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono text-[var(--muted)]">
                    {r.pct_to_high != null ? `${r.pct_to_high.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-[var(--muted)]">
                    {r.pct_to_low != null ? `${r.pct_to_low.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {r.signal === "buy" && <span className="text-green-400 font-bold">↑ BREAKOUT</span>}
                    {r.signal === "sell" && <span className="text-red-400 font-bold">↓ BREAKDOWN</span>}
                    {r.signal === "none" && <span className="text-[var(--muted)]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Turtle Trading System:</strong> Richard Dennis taught novices a rules-based trend system. 20-day entry, 10-day exit.</p>
        <p><strong>Breakout</strong>: close above N-day high. Trend likely starting.</p>
        <p><strong>Stop</strong>: opposite N-day extreme or 2×ATR from entry.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Whipsaws common in choppy markets. Confirm with volume + trend filter. Research only.</div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
