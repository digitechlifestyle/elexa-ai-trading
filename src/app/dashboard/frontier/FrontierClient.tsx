"use client";

import { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";

interface Point {
  ret: number;
  vol: number;
  sharpe: number;
  weights: number[];
}

interface Data {
  symbols: string[];
  days: number;
  samples: number;
  points: Point[];
  max_sharpe: Point;
  min_vol: Point;
}

function colorBySharpe(s: number): string {
  if (s > 1.5) return "#22c55e";
  if (s > 0.5) return "#84cc16";
  if (s > 0) return "#fbbf24";
  return "#ef4444";
}

export default function FrontierClient() {
  const [symbolsInput, setSymbolsInput] = useState(
    "SPY,QQQ,TLT,GLD,BTC,XLE,IWM"
  );
  const [days, setDays] = useState("180");
  const [samples, setSamples] = useState("2000");
  const [data, setData] = useState<Data | null>(null);
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
      const res = await fetch("/api/efficient-frontier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, days: Number(days), samples: Number(samples) }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📈 Efficient Frontier</h1>
        <p className="text-[var(--muted)] text-sm">
          Monte Carlo Markowitz optimization. Find max-Sharpe and min-vol
          portfolios across a basket. The Bridgewater / endowment toolkit.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbols (max 10)
          </label>
          <input
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
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
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Samples</label>
            <input
              type="number"
              value={samples}
              onChange={(e) => setSamples(e.target.value)}
              min={500}
              max={5000}
              step={500}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
          >
            {loading ? "Optimizing…" : "Run"}
          </button>
        </div>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">
              Frontier ({data.samples.toLocaleString()} portfolios)
            </h2>
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  type="number"
                  dataKey="vol"
                  name="Volatility"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                >
                  <Label value="Annualised Volatility →" position="bottom" fill="#9ca3af" fontSize={11} />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="ret"
                  name="Return"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                >
                  <Label
                    value="Annualised Return ↑"
                    angle={-90}
                    position="left"
                    fill="#9ca3af"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip
                  cursor={{ stroke: "#374151" }}
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => Number(v).toFixed(2)}
                />
                <Scatter data={data.points}>
                  {data.points.map((p, i) => (
                    <Cell key={i} fill={colorBySharpe(p.sharpe)} fillOpacity={0.6} />
                  ))}
                </Scatter>
                <Scatter
                  data={[data.max_sharpe]}
                  shape="star"
                  fill="#22c55e"
                />
                <Scatter
                  data={[data.min_vol]}
                  shape="triangle"
                  fill="#3b82f6"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-3 text-center">
              Green star = max Sharpe. Blue triangle = min volatility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="🟢 Max Sharpe portfolio"
              ret={data.max_sharpe.ret}
              vol={data.max_sharpe.vol}
              sharpe={data.max_sharpe.sharpe}
              weights={data.max_sharpe.weights}
              symbols={data.symbols}
            />
            <Card
              title="🔷 Min volatility portfolio"
              ret={data.min_vol.ret}
              vol={data.min_vol.vol}
              sharpe={data.min_vol.sharpe}
              weights={data.min_vol.weights}
              symbols={data.symbols}
            />
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Markowitz assumes returns are normally distributed and covariance is
        stable. Real markets break both assumptions. Use as starting allocation,
        not gospel. Not financial advice.
      </div>
    </div>
  );
}

function Card({
  title,
  ret,
  vol,
  sharpe,
  weights,
  symbols,
}: {
  title: string;
  ret: number;
  vol: number;
  sharpe: number;
  weights: number[];
  symbols: string[];
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2 text-sm mb-4">
        <Stat label="Return" value={`${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`} tone={ret >= 0 ? "good" : "bad"} />
        <Stat label="Vol" value={`${vol.toFixed(1)}%`} />
        <Stat label="Sharpe" value={sharpe.toFixed(2)} tone={sharpe >= 1 ? "good" : "warn"} />
      </div>
      <div className="space-y-1.5">
        {symbols.map((s, i) => (
          <div key={s}>
            <div className="flex justify-between text-xs">
              <span className="font-medium">{s}</span>
              <span className="font-mono">{(weights[i] * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-[var(--background)] rounded">
              <div
                className="h-full bg-indigo-600 rounded"
                style={{ width: `${weights[i] * 100}%` }}
              />
            </div>
          </div>
        ))}
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
    <div className="text-center">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`font-bold ${c}`}>{value}</p>
    </div>
  );
}
