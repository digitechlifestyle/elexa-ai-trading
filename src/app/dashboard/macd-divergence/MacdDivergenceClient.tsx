"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Divergence {
  type: "bullish_regular" | "bearish_regular" | "bullish_hidden" | "bearish_hidden";
  from: { date: string; price: number; macd: number };
  to: { date: string; price: number; macd: number };
}

interface SeriesPoint {
  date: string;
  price: number;
  macd: number;
}

const LABELS: Record<Divergence["type"], { text: string; color: string }> = {
  bullish_regular: { text: "Bullish (reversal)", color: "text-green-400" },
  bearish_regular: { text: "Bearish (reversal)", color: "text-red-400" },
  bullish_hidden: { text: "Hidden bullish (continuation)", color: "text-green-300" },
  bearish_hidden: { text: "Hidden bearish (continuation)", color: "text-red-300" },
};

export default function MacdDivergenceClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState(180);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [divs, setDivs] = useState<Divergence[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>([]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/macd-divergence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), days }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        setDivs([]);
        setSeries([]);
      } else {
        setDivs(j.divergences ?? []);
        setSeries(j.series ?? []);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📐 MACD Divergence Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          Detects regular and hidden divergences between price and MACD. Regular
          divergence signals reversal; hidden divergence signals continuation.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Days back</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value={90}>90</option>
              <option value={180}>180</option>
              <option value={365}>365</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={loading || !symbol}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              {loading ? "Scanning…" : "Scan"}
            </button>
          </div>
        </div>
        {err && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </div>

      {series.length > 0 && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-2">Price</h2>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                    formatter={(v) => [`${Number(v).toFixed(2)}`, "Price"]}
                  />
                  <Line type="monotone" dataKey="price" stroke="#818cf8" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-2">MACD (12,26)</h2>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                    formatter={(v) => [`${Number(v).toFixed(3)}`, "MACD"]}
                  />
                  <Line type="monotone" dataKey="macd" stroke="#fb923c" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {divs.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">
            Detected divergences ({divs.length})
          </h2>
          <ul className="space-y-2">
            {divs.map((d, i) => (
              <li
                key={i}
                className="flex justify-between items-center text-sm border-b border-[var(--card-border)] last:border-0 py-2 gap-3 flex-wrap"
              >
                <span className={`font-semibold ${LABELS[d.type].color}`}>
                  {LABELS[d.type].text}
                </span>
                <span className="text-xs text-[var(--muted)] font-mono">
                  {d.from.date.slice(0, 10)} → {d.to.date.slice(0, 10)}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  Price {d.from.price.toFixed(2)} → {d.to.price.toFixed(2)} | MACD{" "}
                  {d.from.macd.toFixed(3)} → {d.to.macd.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && series.length > 0 && divs.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--muted)]">
          No divergences detected in this window.
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Divergences are not standalone buy/sell signals. Use with structure,
        volume, and risk management. Research only — not financial advice.
      </div>
    </div>
  );
}
