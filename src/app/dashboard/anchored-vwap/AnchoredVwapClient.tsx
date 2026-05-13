"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Point { date: string; price: number; vwap: number | null; }

export default function AnchoredVwapClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [anchorDate, setAnchorDate] = useState("");
  const [days, setDays] = useState(180);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [series, setSeries] = useState<Point[]>([]);
  const [vwap, setVwap] = useState<number | null>(null);
  const [dev, setDev] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [usedAnchor, setUsedAnchor] = useState<string>("");

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/anchored-vwap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), anchor_date: anchorDate || undefined, days }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        setSeries([]);
      } else {
        setSeries(j.series ?? []);
        setVwap(j.current_vwap);
        setDev(j.deviation_pct);
        setPrice(j.current_price);
        setUsedAnchor(j.anchor_date);
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
        <h1 className="text-2xl font-bold mb-1">⚓ Anchored VWAP</h1>
        <p className="text-[var(--muted)] text-sm">
          Volume-weighted average price anchored from a chosen date. Pros use this to gauge institutional cost basis from key events (earnings, breakout, top).
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Anchor date (blank = start of window)</label>
            <input
              type="date"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {loading ? "Loading…" : "Compute"}
            </button>
          </div>
        </div>
        {err && (
          <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>
        )}
      </div>

      {series.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Anchor" value={usedAnchor || "—"} />
            <Stat label="Price" value={price != null ? `$${price.toFixed(2)}` : "—"} />
            <Stat label="VWAP" value={vwap != null ? `$${vwap.toFixed(2)}` : "—"} />
            <Stat
              label="Deviation"
              value={dev != null ? `${dev >= 0 ? "+" : ""}${dev.toFixed(2)}%` : "—"}
              color={dev != null ? (dev >= 0 ? "text-green-400" : "text-red-400") : ""}
            />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                    formatter={(v) => [`${Number(v).toFixed(2)}`, ""]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#818cf8" dot={false} strokeWidth={1.5} name="Price" />
                  <Line type="monotone" dataKey="vwap" stroke="#fb923c" dot={false} strokeWidth={1.5} name="VWAP" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Price above VWAP:</strong> buyers since anchor are in profit on average → bullish bias.</p>
        <p><strong>Price below VWAP:</strong> buyers since anchor underwater → resistance overhead.</p>
        <p>Common anchors: earnings, IPO, swing low/high, FOMC.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Research only — not financial advice.
      </div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
