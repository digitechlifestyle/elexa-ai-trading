"use client";

import { useMemo, useState } from "react";

type Side = "long" | "short";

export default function ExitPlannerClient() {
  const [side, setSide] = useState<Side>("long");
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);
  const [shares, setShares] = useState(100);
  const [t1Pct, setT1Pct] = useState(33);
  const [t2Pct, setT2Pct] = useState(33);
  const [t3Pct, setT3Pct] = useState(34);
  const [r1, setR1] = useState(1);
  const [r2, setR2] = useState(2);
  const [r3, setR3] = useState(3);
  const [moveToBreakeven, setMoveToBreakeven] = useState(true);

  const plan = useMemo(() => {
    const risk = Math.abs(entry - stop);
    const sign = side === "long" ? 1 : -1;
    const target = (r: number) => entry + sign * risk * r;

    const totalRisk = risk * shares;
    const targets = [
      { r: r1, pct: t1Pct, price: target(r1), shares: Math.floor(shares * (t1Pct / 100)) },
      { r: r2, pct: t2Pct, price: target(r2), shares: Math.floor(shares * (t2Pct / 100)) },
      { r: r3, pct: t3Pct, price: target(r3), shares: Math.floor(shares * (t3Pct / 100)) },
    ];

    const pnlAt = (t: (typeof targets)[number]) =>
      sign * (t.price - entry) * t.shares;

    const totalProfit = targets.reduce((s, t) => s + pnlAt(t), 0);
    const expectedR = totalProfit / totalRisk;
    const totalPctSold = t1Pct + t2Pct + t3Pct;

    return { risk, totalRisk, targets, pnlAt, totalProfit, expectedR, totalPctSold };
  }, [side, entry, stop, shares, t1Pct, t2Pct, t3Pct, r1, r2, r3]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🪜 Trade Exit Planner</h1>
        <p className="text-[var(--muted)] text-sm">
          Scale out in tranches at multiple R-multiples. Optional breakeven stop after T1.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Side</label>
            <select value={side} onChange={(e) => setSide(e.target.value as Side)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
              <option value="long">Long</option><option value="short">Short</option>
            </select>
          </div>
          <Field label="Shares" value={shares} setValue={setShares} step={1} />
          <Field label="Entry ($)" value={entry} setValue={setEntry} step={0.01} />
          <Field label="Stop ($)" value={stop} setValue={setStop} step={0.01} />
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-sm">Tranches</h2>
        {([0, 1, 2] as const).map((i) => {
          const rState = [r1, r2, r3][i];
          const setR = [setR1, setR2, setR3][i];
          const pctState = [t1Pct, t2Pct, t3Pct][i];
          const setPct = [setT1Pct, setT2Pct, setT3Pct][i];
          return (
            <div key={i} className="grid grid-cols-3 gap-3 items-end">
              <Field label={`T${i + 1} R-multiple`} value={rState} setValue={setR} step={0.1} />
              <Field label={`T${i + 1} % of position`} value={pctState} setValue={setPct} step={1} />
              <div className="text-sm font-mono pb-2">
                @ ${plan.targets[i].price.toFixed(2)} → {plan.targets[i].shares} shares
              </div>
            </div>
          );
        })}
        {plan.totalPctSold !== 100 && (
          <p className="text-xs text-amber-400">
            Tranches total {plan.totalPctSold}% — should sum to 100%.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={moveToBreakeven} onChange={(e) => setMoveToBreakeven(e.target.checked)} />
          <span>Move stop to breakeven after T1 fills</span>
        </label>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-2">
        <Row label="Risk per share" value={`$${plan.risk.toFixed(2)}`} />
        <Row label="Total risk ($)" value={`$${plan.totalRisk.toFixed(2)}`} color="text-red-400" />
        {plan.targets.map((t, i) => (
          <Row key={i} label={`T${i + 1} (${t.r}R) @ $${t.price.toFixed(2)}`}
            value={`+$${plan.pnlAt(t).toFixed(2)}`} color="text-green-400" />
        ))}
        <Row label="Total profit if all hit" value={`$${plan.totalProfit.toFixed(2)}`} color="text-green-400" />
        <Row label="Blended R" value={`${plan.expectedR.toFixed(2)}R`} color="text-indigo-400" />
        {moveToBreakeven && (
          <Row label="Worst case after T1" value={`+$${plan.pnlAt(plan.targets[0]).toFixed(2)} (BE stop)`}
            color="text-amber-400" />
        )}
      </div>

      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
        <p><strong>Classic 3-tranche:</strong> 33% at 1R, 33% at 2R, 34% runner at 3R+.</p>
        <p><strong>Breakeven stop after T1</strong> guarantees free trade — worst case is +T1 profit.</p>
        <p><strong>Blended R</strong> = avg profit per unit of initial risk.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Slippage and gaps reduce realised R. Research only.</div>
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
    <div className="flex justify-between text-sm py-2 border-b border-[var(--card-border)] last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
