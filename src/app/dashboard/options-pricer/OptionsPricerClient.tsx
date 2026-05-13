"use client";

import { useMemo, useState } from "react";
import { blackScholes } from "@/lib/black-scholes";

export default function OptionsPricerClient() {
  const [spot, setSpot] = useState("100");
  const [strike, setStrike] = useState("100");
  const [rate, setRate] = useState("4");
  const [vol, setVol] = useState("25");
  const [days, setDays] = useState("30");

  const result = useMemo(() => {
    return blackScholes({
      spot: Number(spot) || 0,
      strike: Number(strike) || 0,
      rate: (Number(rate) || 0) / 100,
      vol: (Number(vol) || 0) / 100,
      days: Number(days) || 0,
    });
  }, [spot, strike, rate, vol, days]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🧮 Black-Scholes Options Pricer</h1>
        <p className="text-[var(--muted)] text-sm">
          European call/put prices and full Greeks. No dividend assumed. Inputs
          update instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Inputs</h2>
          <Field label="Spot price ($)" value={spot} onChange={setSpot} />
          <Field label="Strike price ($)" value={strike} onChange={setStrike} />
          <Field label="Risk-free rate (%)" value={rate} onChange={setRate} hint="~4% (10Y yield)" />
          <Field label="Volatility (% annual)" value={vol} onChange={setVol} hint="20-30% typical for large caps" />
          <Field label="Days to expiry" value={days} onChange={setDays} hint="Calendar days" />
        </div>

        <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Prices</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-950 border border-green-800 rounded-lg p-4 text-center">
              <p className="text-xs text-green-300 uppercase">Call</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                ${result.call_price.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-center">
              <p className="text-xs text-red-300 uppercase">Put</p>
              <p className="text-3xl font-bold text-red-400 mt-1">
                ${result.put_price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Greeks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <GreekStat label="Delta call" value={result.delta_call.toFixed(3)} hint="Δ price per $1 spot" />
          <GreekStat label="Delta put" value={result.delta_put.toFixed(3)} />
          <GreekStat label="Gamma" value={result.gamma.toFixed(4)} hint="Δ delta per $1 spot" />
          <GreekStat label="Vega" value={result.vega.toFixed(3)} hint="$ per 1% vol" />
          <GreekStat label="Theta call" value={result.theta_call.toFixed(3)} hint="$ per day" tone="bad" />
          <GreekStat label="Theta put" value={result.theta_put.toFixed(3)} tone="bad" />
          <GreekStat label="Rho call" value={result.rho_call.toFixed(3)} hint="$ per 1% rate" />
          <GreekStat label="Rho put" value={result.rho_put.toFixed(3)} />
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
        <h2 className="font-semibold mb-2">Greeks 101</h2>
        <p><strong>Delta</strong>: how option price moves per $1 in underlying. 0.5 = ATM call.</p>
        <p><strong>Gamma</strong>: how fast delta changes. Peaks ATM near expiry.</p>
        <p><strong>Vega</strong>: how much option price moves per 1% vol change. Long options = long vega.</p>
        <p><strong>Theta</strong>: time decay $ per day. Always negative for long options.</p>
        <p><strong>Rho</strong>: sensitivity to interest rates. Usually small for short-dated options.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Black-Scholes assumes constant vol, no dividends, European exercise, log-normal returns.
        Real prices deviate due to vol skew + early-exercise premium. Educational tool.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
      />
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </div>
  );
}

function GreekStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "bad" | "good";
}) {
  const c = tone === "bad" ? "text-red-400" : tone === "good" ? "text-green-400" : "";
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`font-mono font-semibold text-lg ${c}`}>{value}</p>
      {hint && <p className="text-[10px] text-[var(--muted)] mt-1">{hint}</p>}
    </div>
  );
}
