"use client";

import { useMemo, useState } from "react";

/**
 * Kelly Criterion:
 *   f* = (bp - q) / b
 *   where b = avg_win / avg_loss (payoff ratio), p = win rate, q = 1 - p
 *
 * Fractional Kelly (half/quarter) usually preferred — full Kelly is wild.
 */
export default function KellyClient() {
  const [winRate, setWinRate] = useState(55); // %
  const [avgWin, setAvgWin] = useState(150);
  const [avgLoss, setAvgLoss] = useState(100);
  const [equity, setEquity] = useState(10000);
  const [fraction, setFraction] = useState(0.5); // half-Kelly default

  const result = useMemo(() => {
    const p = winRate / 100;
    const q = 1 - p;
    const b = avgLoss > 0 ? avgWin / avgLoss : 0;
    const full = b > 0 ? (b * p - q) / b : 0;
    const expectancy = p * avgWin - q * avgLoss;
    const partial = full * fraction;
    return {
      full,
      partial,
      payoff: b,
      expectancy,
      dollar: equity * Math.max(0, partial),
      risk_dollar: equity * Math.max(0, partial) * (avgLoss / (avgWin + avgLoss)),
    };
  }, [winRate, avgWin, avgLoss, equity, fraction]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📐 Kelly Criterion Calculator</h1>
        <p className="text-[var(--muted)] text-sm">
          Optimal fraction of equity to risk per trade based on edge. Full Kelly maximises long-run growth; fractional Kelly cuts variance.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <Field label="Win rate (%)" value={winRate} setValue={setWinRate} step={0.5} />
        <Field label="Average win ($)" value={avgWin} setValue={setAvgWin} step={1} />
        <Field label="Average loss ($, positive)" value={avgLoss} setValue={setAvgLoss} step={1} />
        <Field label="Account equity ($)" value={equity} setValue={setEquity} step={100} />
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Kelly fraction</label>
          <select
            value={fraction}
            onChange={(e) => setFraction(Number(e.target.value))}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>Full Kelly (aggressive)</option>
            <option value={0.5}>Half Kelly (recommended)</option>
            <option value={0.25}>Quarter Kelly (conservative)</option>
            <option value={0.1}>Tenth Kelly (very conservative)</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
        <Row label="Payoff ratio (b)" value={result.payoff.toFixed(2)} />
        <Row label="Expectancy per trade" value={`$${result.expectancy.toFixed(2)}`}
          color={result.expectancy >= 0 ? "text-green-400" : "text-red-400"} />
        <Row label="Full Kelly fraction" value={`${(result.full * 100).toFixed(2)}%`}
          color={result.full > 0 ? "text-green-400" : "text-red-400"} />
        <Row label="Recommended fraction" value={`${(result.partial * 100).toFixed(2)}%`}
          color="text-indigo-400" />
        <Row label="Position size ($)" value={`$${result.dollar.toFixed(0)}`} color="text-indigo-400" />
        <Row label="Risked per trade ($)" value={`$${result.risk_dollar.toFixed(0)}`} color="text-amber-400" />
      </div>

      {result.full <= 0 && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
          <strong>No edge.</strong> With these stats, Kelly says don&apos;t trade this setup. Improve win rate or R:R first.
        </div>
      )}

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Formula:</strong> f* = (bp - q) / b where b = avg_win / avg_loss, p = win rate, q = 1 - p.</p>
        <p><strong>Half Kelly</strong> captures ~75% of Kelly&apos;s growth at ~50% the volatility — most pros use 0.25-0.5x.</p>
        <p><strong>Garbage in, garbage out:</strong> needs &gt;30 sample trades for win-rate estimate to stabilise.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Full Kelly produces 50%+ drawdowns. Backtest your stats first. Research only — not financial advice.
      </div>
    </div>
  );
}

function Field({ label, value, setValue, step }: { label: string; value: number; setValue: (n: number) => void; step: number }) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1">{label}</label>
      <input type="number" value={value} step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono" />
    </div>
  );
}

function Row({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
