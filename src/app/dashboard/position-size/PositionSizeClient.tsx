"use client";

import { useMemo, useState } from "react";

export default function PositionSizeClient() {
  const [account, setAccount] = useState("100000");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("100");
  const [stop, setStop] = useState("95");
  const [maxPositionPct, setMaxPositionPct] = useState("20");

  const calc = useMemo(() => {
    const acct = Number(account) || 0;
    const risk = (Number(riskPct) || 0) / 100;
    const e = Number(entry) || 0;
    const s = Number(stop) || 0;
    const maxPos = (Number(maxPositionPct) || 100) / 100;

    if (acct <= 0 || e <= 0 || s <= 0 || risk <= 0) {
      return null;
    }
    const perShareRisk = Math.abs(e - s);
    if (perShareRisk <= 0) return null;
    const dollarRisk = acct * risk;
    const sharesByRisk = Math.floor(dollarRisk / perShareRisk);
    const sharesByCap = Math.floor((acct * maxPos) / e);
    const shares = Math.min(sharesByRisk, sharesByCap);
    const notional = shares * e;
    const totalRisk = shares * perShareRisk;
    const riskOfAccount = (totalRisk / acct) * 100;
    const rrStop = perShareRisk;
    const target1R = e + (e > s ? rrStop : -rrStop);
    const target2R = e + (e > s ? rrStop * 2 : -rrStop * 2);
    const target3R = e + (e > s ? rrStop * 3 : -rrStop * 3);
    return {
      shares,
      shares_by_risk: sharesByRisk,
      shares_by_cap: sharesByCap,
      notional,
      perShareRisk,
      dollarRisk,
      totalRisk,
      riskOfAccount,
      target1R,
      target2R,
      target3R,
      side: e > s ? ("long" as const) : ("short" as const),
    };
  }, [account, riskPct, entry, stop, maxPositionPct]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📏 Position Size Calculator</h1>
        <p className="text-[var(--muted)] text-sm">
          How many shares to buy so you don&apos;t lose more than X% if your
          stop hits. The single most important calculation in trading.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Inputs</h2>
          <Field
            label="Account size ($)"
            value={account}
            onChange={setAccount}
            hint="Total tradable equity"
          />
          <Field
            label="Risk per trade (%)"
            value={riskPct}
            onChange={setRiskPct}
            hint="Max % of account to lose if stop is hit. Pros: 0.5–2%."
          />
          <Field
            label="Entry price ($)"
            value={entry}
            onChange={setEntry}
            hint="Planned entry"
          />
          <Field
            label="Stop-loss price ($)"
            value={stop}
            onChange={setStop}
            hint="Where you exit if wrong"
          />
          <Field
            label="Max position size (% of account)"
            value={maxPositionPct}
            onChange={setMaxPositionPct}
            hint="Concentration cap. 10–25% typical"
          />
        </div>

        <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Result</h2>
          {calc ? (
            <>
              <div className="text-center py-3">
                <p className="text-xs text-[var(--muted)] uppercase">
                  Buy this many shares
                </p>
                <p className="text-5xl font-bold text-indigo-400 mt-2">
                  {calc.shares.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--muted)] mt-2 uppercase">
                  {calc.side}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KV label="Notional" value={`$${calc.notional.toFixed(2)}`} />
                <KV
                  label="Total $ at risk"
                  value={`$${calc.totalRisk.toFixed(2)}`}
                />
                <KV
                  label="Per-share risk"
                  value={`$${calc.perShareRisk.toFixed(2)}`}
                />
                <KV
                  label="% of account at risk"
                  value={`${calc.riskOfAccount.toFixed(2)}%`}
                />
              </div>
              <div className="text-xs text-[var(--muted)] mt-3 pt-3 border-t border-[var(--card-border)]">
                Limiting factor:{" "}
                {calc.shares === calc.shares_by_risk
                  ? "stop-loss risk"
                  : "position cap"}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <Target label="1R" value={calc.target1R} side={calc.side} />
                <Target label="2R" value={calc.target2R} side={calc.side} />
                <Target label="3R" value={calc.target3R} side={calc.side} />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)] text-center py-12">
              Enter valid inputs above.
            </p>
          )}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
        <h2 className="font-semibold mb-2">Position sizing rules</h2>
        <ul className="space-y-1.5">
          <li>
            <strong className="text-green-400">≤ 1%</strong>: Pro standard. 100
            losing trades = 36% drawdown. Survivable.
          </li>
          <li>
            <strong className="text-amber-400">1–2%</strong>: Aggressive but
            still survivable for experienced traders.
          </li>
          <li>
            <strong className="text-red-400">≥ 5%</strong>: Gambling. 7 losses
            in a row = -30%. Common path to blowup.
          </li>
        </ul>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Position sizing math assumes your stop fills at the price. Gaps and
        slippage can amplify losses. Not financial advice.
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
      <label className="block text-sm mb-1.5">{label}</label>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className="font-mono font-semibold">{value}</p>
    </div>
  );
}

function Target({
  label,
  value,
  side,
}: {
  label: string;
  value: number;
  side: "long" | "short";
}) {
  return (
    <div className="bg-green-950 border border-green-800 rounded-lg p-2 text-center">
      <p className="text-[10px] text-green-300 uppercase">{label} target</p>
      <p className="text-sm font-mono font-semibold text-green-400">
        ${value.toFixed(2)}
      </p>
    </div>
  );
}
