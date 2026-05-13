"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  Cell,
} from "recharts";

interface Point {
  date: string;
  close: number;
  ema20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
  adx: number | null;
}

interface Summary {
  price: number;
  above_sma200: boolean | null;
  above_sma50: boolean | null;
  rsi: number | null;
  rsi_state: "overbought" | "oversold" | "neutral" | null;
  macd_bull: boolean | null;
  adx: number | null;
  adx_state: "trending" | "ranging" | null;
}

interface Data {
  symbol: string;
  days: number;
  series: Point[];
  summary: Summary;
}

export default function IndicatorsClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("");
  const [days, setDays] = useState("180");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(s: string, d: number) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/indicators?symbol=${s}&days=${d}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(symbol, Number(days));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 Indicator Dashboard</h1>
        <p className="text-[var(--muted)] text-sm">
          EMA20 / SMA50 / SMA200 / Bollinger / RSI / MACD / ADX — all together
          for any symbol.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const s = input.trim().toUpperCase();
          if (s) {
            setSymbol(s);
            setInput("");
            load(s, Number(days));
          }
        }}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex flex-wrap gap-2 items-end"
      >
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbol — current: {symbol}
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="AAPL, BTC, GLD…"
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Days</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min={60}
            max={365}
            className="w-20 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="vs SMA200"
              value={
                data.summary.above_sma200 == null
                  ? "—"
                  : data.summary.above_sma200
                  ? "ABOVE"
                  : "BELOW"
              }
              tone={data.summary.above_sma200 ? "good" : "bad"}
            />
            <Stat
              label="vs SMA50"
              value={
                data.summary.above_sma50 == null
                  ? "—"
                  : data.summary.above_sma50
                  ? "ABOVE"
                  : "BELOW"
              }
              tone={data.summary.above_sma50 ? "good" : "bad"}
            />
            <Stat
              label="RSI(14)"
              value={
                data.summary.rsi != null
                  ? `${data.summary.rsi.toFixed(1)} (${data.summary.rsi_state})`
                  : "—"
              }
              tone={
                data.summary.rsi_state === "overbought"
                  ? "bad"
                  : data.summary.rsi_state === "oversold"
                  ? "good"
                  : "warn"
              }
            />
            <Stat
              label="ADX(14)"
              value={
                data.summary.adx != null
                  ? `${data.summary.adx.toFixed(1)} (${data.summary.adx_state})`
                  : "—"
              }
            />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Price + MAs + Bollinger</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                />
                <Line type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} dot={false} name="Close" />
                <Line type="monotone" dataKey="ema20" stroke="#22c55e" strokeWidth={1.5} dot={false} name="EMA20" />
                <Line type="monotone" dataKey="sma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="SMA50" />
                <Line type="monotone" dataKey="sma200" stroke="#ef4444" strokeWidth={1.5} dot={false} name="SMA200" />
                <Line type="monotone" dataKey="bb_upper" stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" dot={false} name="BB upper" />
                <Line type="monotone" dataKey="bb_lower" stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" dot={false} name="BB lower" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">RSI(14)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => Number(v).toFixed(1)}
                />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rsi" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">MACD (12, 26, 9)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => Number(v).toFixed(3)}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <Bar dataKey="macd_hist">
                  {data.series.map((p, i) => (
                    <Cell
                      key={i}
                      fill={
                        p.macd_hist == null
                          ? "#9ca3af"
                          : p.macd_hist >= 0
                          ? "#22c55e"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="macd_signal" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">ADX(14) — trend strength</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={10} domain={[0, 60]} />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => Number(v).toFixed(1)}
                />
                <ReferenceLine y={25} stroke="#fbbf24" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="adx" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-2 text-center">
              ADX &gt; 25 = trending. &lt; 20 = ranging. Yellow line = 25 threshold.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Indicators describe the past. Combine multiple, never rely on one
        alone. Not financial advice.
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  const c =
    tone === "good"
      ? "text-green-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-red-400"
      : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
