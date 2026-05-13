"use client";

import { useState } from "react";

interface Result {
  symbol: string;
  benchmark: string;
  days: number;
  sample_n: number;
  beta: number;
  alpha_annual_pct: number;
  correlation: number;
  r_squared: number;
}

export default function BetaClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [benchmark, setBenchmark] = useState("SPY");
  const [days, setDays] = useState("180");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, benchmark, days: Number(days) }),
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">β Beta Calculator</h1>
        <p className="text-[var(--muted)] text-sm">
          Beta vs benchmark, alpha (annualised), correlation, and R². Tells you
          how much of a stock&apos;s move is just &quot;the market&quot;.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Benchmark</label>
          <input
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
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
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
        >
          {loading ? "Calculating…" : "Calculate"}
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
              label="Beta"
              value={data.beta.toFixed(3)}
              tone={
                Math.abs(data.beta - 1) < 0.2
                  ? "warn"
                  : data.beta > 1
                  ? "bad"
                  : "good"
              }
            />
            <Stat
              label="Alpha (annual)"
              value={`${data.alpha_annual_pct >= 0 ? "+" : ""}${data.alpha_annual_pct.toFixed(2)}%`}
              tone={data.alpha_annual_pct >= 0 ? "good" : "bad"}
            />
            <Stat label="Correlation" value={data.correlation.toFixed(3)} />
            <Stat label="R²" value={data.r_squared.toFixed(3)} />
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
            <h2 className="font-semibold mb-2">Reading the numbers</h2>
            <p>
              <strong>Beta = {data.beta.toFixed(2)}</strong>: When {data.benchmark}{" "}
              moves 1%, {data.symbol} tends to move{" "}
              <strong>{data.beta.toFixed(2)}%</strong>. Beta &gt; 1 = more volatile, &lt; 1
              = less volatile.
            </p>
            <p>
              <strong>Alpha (ann.) = {data.alpha_annual_pct.toFixed(2)}%</strong>:
              Annualised excess return beyond what beta predicts. Positive alpha = beats benchmark on a risk-adjusted basis.
            </p>
            <p>
              <strong>R² = {data.r_squared.toFixed(2)}</strong>:{" "}
              {(data.r_squared * 100).toFixed(0)}% of {data.symbol}&apos;s
              variance is explained by {data.benchmark}. Higher = more
              market-driven, less idiosyncratic.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Beta is rolling. Changes with regime. Use multiple lookbacks.
        Research only — not financial advice.
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
      <p className={`text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
