"use client";

import { useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";

interface Envelope {
  step: number;
  p05: number;
  p50: number;
  p95: number;
}

interface SimData {
  symbol: string;
  starting_value: number;
  horizon_days: number;
  paths: number;
  annualised_return_pct: number;
  annualised_vol_pct: number;
  final_p05: number;
  final_p50: number;
  final_p95: number;
  prob_positive: number;
  envelope: Envelope[];
  sample_paths: number[][];
}

export default function MonteCarloClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [horizon, setHorizon] = useState("60");
  const [lookback, setLookback] = useState("180");
  const [paths, setPaths] = useState("200");
  const [starting, setStarting] = useState("10000");
  const [data, setData] = useState<SimData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/montecarlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          horizon_days: Number(horizon),
          lookback_days: Number(lookback),
          paths: Number(paths),
          starting_value: Number(starting),
        }),
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

  // Build chart data: envelope rows enriched with sample_paths flattened
  const chartData = data
    ? data.envelope.map((e, i) => {
        const row: Record<string, number> = {
          step: e.step,
          p05: e.p05,
          p50: e.p50,
          p95: e.p95,
        };
        data.sample_paths.forEach((p, pi) => {
          row[`path${pi}`] = p[i];
        });
        return row;
      })
    : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎲 Monte Carlo Simulator</h1>
        <p className="text-[var(--muted)] text-sm">
          Sample future paths from historical daily returns. Geometric Brownian
          motion. Useful for sizing risk and seeing realistic distributions.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <Input label="Symbol" value={symbol} onChange={setSymbol} />
        <Input label="Lookback (d)" value={lookback} onChange={setLookback} type="number" />
        <Input label="Horizon (d)" value={horizon} onChange={setHorizon} type="number" />
        <Input label="Paths" value={paths} onChange={setPaths} type="number" />
        <Input label="Start $" value={starting} onChange={setStarting} type="number" />
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
        >
          {loading ? "Simulating…" : "Run Simulation"}
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
            <Stat label="Ann. return" value={`${data.annualised_return_pct.toFixed(1)}%`} tone={data.annualised_return_pct >= 0 ? "good" : "bad"} />
            <Stat label="Ann. vol" value={`${data.annualised_vol_pct.toFixed(1)}%`} />
            <Stat label="Prob > start" value={`${(data.prob_positive * 100).toFixed(0)}%`} tone={data.prob_positive >= 0.5 ? "good" : "bad"} />
            <Stat label="Paths" value={String(data.paths)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Stat label="5th percentile (worst)" value={`$${data.final_p05.toFixed(0)}`} tone="bad" />
            <Stat label="Median" value={`$${data.final_p50.toFixed(0)}`} />
            <Stat label="95th percentile (best)" value={`$${data.final_p95.toFixed(0)}`} tone="good" />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Path envelope</h2>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="step" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                />
                <Area type="monotone" dataKey="p95" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                <Area type="monotone" dataKey="p05" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Line type="monotone" dataKey="p50" stroke="#6366f1" strokeWidth={3} dot={false} />
                {data.sample_paths.map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`path${i}`}
                    stroke="#9ca3af"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    dot={false}
                  />
                ))}
                <ReferenceLine y={data.starting_value} stroke="#fbbf24" strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-3 text-center">
              Indigo: median. Green: 95th percentile envelope. Red: 5th percentile (downside). Grey: 5 sample paths. Yellow dashed: start.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Monte Carlo assumes log-normal returns and ignores regime shifts.
        Past distribution may not represent future. Use for sizing intuition,
        not point forecasts. Research only.
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
      />
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
  tone?: "good" | "bad";
}) {
  const c = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
