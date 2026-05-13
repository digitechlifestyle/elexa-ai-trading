"use client";

import { useState } from "react";

interface WeightRow {
  symbol: string;
  weight_pct: number;
  vol_ann_pct: number;
}

interface Data {
  days: number;
  inverse_vol: WeightRow[];
  equal_weight: WeightRow[];
}

export default function RiskParityClient() {
  const [symbolsInput, setSymbolsInput] = useState(
    "SPY,QQQ,TLT,GLD,BTC,XLE,XLF,EFA"
  );
  const [days, setDays] = useState("90");
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
      const res = await fetch("/api/risk-parity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols, days: Number(days) }),
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
        <h1 className="text-2xl font-bold mb-1">⚖️ Risk Parity Allocator</h1>
        <p className="text-[var(--muted)] text-sm">
          Inverse-volatility weights — each asset gets a slice inversely
          proportional to its vol. The risk-parity approach behind Bridgewater
          All-Weather.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Symbols (max 15)
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
            {loading ? "Computing…" : "Allocate"}
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
              Inverse-vol weights ({data.days}-day window)
            </h2>
            <div className="space-y-3">
              {data.inverse_vol.map((w) => (
                <div key={w.symbol}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-bold">{w.symbol}</span>
                    <span>
                      <span className="font-semibold">{w.weight_pct.toFixed(1)}%</span>
                      <span className="text-[var(--muted)] text-xs ml-2">
                        vol {w.vol_ann_pct.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--background)] rounded overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded"
                      style={{ width: `${w.weight_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Equal-weight comparison</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {data.equal_weight.map((w) => (
                <div
                  key={w.symbol}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded p-2"
                >
                  <p className="font-bold">{w.symbol}</p>
                  <p className="text-[var(--muted)]">
                    {w.weight_pct.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              Equal-weight is naive — lets high-vol assets dominate risk
              contribution. Risk parity equalises the risk contribution
              instead, putting more notional in the calm assets.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Inverse-vol assumes asset volatility is stationary and ignores
        correlation. Full risk parity uses the covariance matrix. Research only.
      </div>
    </div>
  );
}
