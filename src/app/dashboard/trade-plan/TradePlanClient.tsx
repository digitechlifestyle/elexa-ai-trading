"use client";

import { useState } from "react";

interface Ctx {
  price: number;
  high_52w: number;
  low_52w: number;
  ma_50: number;
  ma_200: number;
  rsi_14: number;
  change_30d_pct: number;
}

interface Plan {
  symbol: string;
  direction: "long" | "short";
  horizon: "scalp" | "swing" | "position";
  context: Ctx;
  plan: string;
}

export default function TradePlanClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [horizon, setHorizon] = useState<"scalp" | "swing" | "position">("swing");
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [data, setData] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/trade-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction,
          horizon,
          account_size: Number(accountSize),
          risk_pct: Number(riskPct),
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎯 AI Trade Plan Generator</h1>
        <p className="text-[var(--muted)] text-sm">
          Quant Agent builds a structured plan with thesis, entry, stop,
          targets, position size, and invalidation. Pull live context, get
          actionable research.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
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
          <label className="block text-xs text-[var(--muted)] mb-1">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "long" | "short")}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Horizon</label>
          <select
            value={horizon}
            onChange={(e) =>
              setHorizon(e.target.value as "scalp" | "swing" | "position")
            }
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="scalp">Scalp (intraday)</option>
            <option value="swing">Swing (days-weeks)</option>
            <option value="position">Position (weeks-months)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Account $</label>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Risk %</label>
          <input
            type="number"
            step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
        >
          {loading ? "Generating plan…" : "Generate Trade Plan"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Price" value={`$${data.context.price.toFixed(2)}`} />
            <Stat
              label="RSI(14)"
              value={data.context.rsi_14.toFixed(1)}
              tone={
                data.context.rsi_14 > 70
                  ? "bad"
                  : data.context.rsi_14 < 30
                  ? "good"
                  : undefined
              }
            />
            <Stat
              label="vs 50d MA"
              value={`${(((data.context.price - data.context.ma_50) / data.context.ma_50) * 100).toFixed(1)}%`}
              tone={
                data.context.price >= data.context.ma_50 ? "good" : "bad"
              }
            />
            <Stat
              label="30d change"
              value={`${data.context.change_30d_pct >= 0 ? "+" : ""}${data.context.change_30d_pct.toFixed(1)}%`}
              tone={data.context.change_30d_pct >= 0 ? "good" : "bad"}
            />
          </div>

          <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
              {data.plan}
            </pre>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ AI trade plans are research, not advice. Always run through Risk
        Agent before execution. Past patterns don&apos;t guarantee future
        outcomes.
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
  tone?: "good" | "bad";
}) {
  const c = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`font-bold ${c}`}>{value}</p>
    </div>
  );
}
