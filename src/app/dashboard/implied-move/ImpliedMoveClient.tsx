"use client";

import { useMemo, useState } from "react";

/**
 * Implied move calculator.
 * Two paths:
 *  1) From ATM straddle premium: move ≈ (call + put) × 0.85
 *  2) From IV: move ≈ price × IV × sqrt(days/365)
 *
 * Standard rule of thumb: ATM straddle covers ~85% of one-SD outcomes
 * because it's slightly OTM-distance discounted.
 */
function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </div>
  );
}

export default function ImpliedMoveClient() {
  const [price, setPrice] = useState(100);
  const [call, setCall] = useState(3);
  const [put, setPut] = useState(3);
  const [iv, setIv] = useState(30); // %
  const [days, setDays] = useState(7);

  const fromStraddle = useMemo(() => {
    const move = (call + put) * 0.85;
    return {
      dollar: move,
      pct: price > 0 ? (move / price) * 100 : 0,
      upper: price + move,
      lower: price - move,
    };
  }, [call, put, price]);

  const fromIv = useMemo(() => {
    const t = days / 365;
    const move = price * (iv / 100) * Math.sqrt(t);
    return {
      dollar: move,
      pct: price > 0 ? (move / price) * 100 : 0,
      upper: price + move,
      lower: price - move,
    };
  }, [iv, days, price]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎯 Implied Move Calculator</h1>
        <p className="text-[var(--muted)] text-sm">
          One-standard-deviation expected move from ATM straddle price or implied
          volatility. ~68% probability the stock stays inside the band by expiry.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Underlying</h2>
        <label className="block text-xs text-[var(--muted)] mb-1">Spot price ($)</label>
        <input
          type="number"
          value={price}
          step={0.01}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Straddle */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">From ATM straddle</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">ATM call ($)</label>
              <input
                type="number"
                value={call}
                step={0.01}
                onChange={(e) => setCall(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">ATM put ($)</label>
              <input
                type="number"
                value={put}
                step={0.01}
                onChange={(e) => setPut(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <Row label="Expected move ($)" value={`$${fromStraddle.dollar.toFixed(2)}`} />
          <Row label="Expected move (%)" value={`${fromStraddle.pct.toFixed(2)}%`} />
          <Row label="Upper band (1σ)" value={`$${fromStraddle.upper.toFixed(2)}`} />
          <Row label="Lower band (1σ)" value={`$${fromStraddle.lower.toFixed(2)}`} />
          <p className="text-xs text-[var(--muted)] mt-3">
            Formula: (call + put) × 0.85. ATM straddle includes time value; 0.85
            adjusts to approx one-SD outcome.
          </p>
        </div>

        {/* Method 2: IV */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">From implied volatility</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">IV (% annualised)</label>
              <input
                type="number"
                value={iv}
                step={0.1}
                onChange={(e) => setIv(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Days to expiry</label>
              <input
                type="number"
                value={days}
                step={1}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <Row label="Expected move ($)" value={`$${fromIv.dollar.toFixed(2)}`} />
          <Row label="Expected move (%)" value={`${fromIv.pct.toFixed(2)}%`} />
          <Row label="Upper band (1σ)" value={`$${fromIv.upper.toFixed(2)}`} />
          <Row label="Lower band (1σ)" value={`$${fromIv.lower.toFixed(2)}`} />
          <p className="text-xs text-[var(--muted)] mt-3">
            Formula: price × IV × √(days/365). Assumes lognormal returns, no
            drift.
          </p>
        </div>
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>One standard deviation</strong> ≈ 68% of expected outcomes inside band.</p>
        <p><strong>Two standard deviations</strong> ≈ 95% — multiply the move by 2.</p>
        <p>Pre-earnings: straddle method reflects market-implied move best.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Implied move is a probability estimate, not a forecast. Use for
        sizing and strike selection — not as a directional signal.
      </div>
    </div>
  );
}
