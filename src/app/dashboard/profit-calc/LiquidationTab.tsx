"use client";

import { useMemo, useState } from "react";

export default function LiquidationTab() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("100");
  const [leverage, setLeverage] = useState("10");
  const [mmPct, setMmPct] = useState("0.5");

  const calc = useMemo(() => {
    const e = Number(entry) || 0;
    const lev = Math.max(1, Number(leverage) || 1);
    const mm = (Number(mmPct) || 0) / 100;
    if (e <= 0) return null;

    // For isolated long: liq when (entry - liq) / entry = 1/lev - mm
    // → liq = entry * (1 - 1/lev + mm)
    // For short: liq = entry * (1 + 1/lev - mm)
    const initialMargin = 1 / lev;
    const liq =
      side === "long"
        ? e * (1 - initialMargin + mm)
        : e * (1 + initialMargin - mm);
    const distancePct = ((Math.abs(liq - e) / e) * 100);
    const safeBuffer = distancePct - mm * 100;

    return { liq, distancePct, safeBuffer, initialMarginPct: initialMargin * 100 };
  }, [side, entry, leverage, mmPct]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Inputs</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setSide("long")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
              side === "long"
                ? "bg-green-700 border-green-600 text-white"
                : "border-[var(--card-border)] text-[var(--muted)]"
            }`}
          >
            Long
          </button>
          <button
            onClick={() => setSide("short")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
              side === "short"
                ? "bg-red-800 border-red-700 text-white"
                : "border-[var(--card-border)] text-[var(--muted)]"
            }`}
          >
            Short
          </button>
        </div>

        <Field label="Entry price ($)" value={entry} onChange={setEntry} />
        <Field
          label="Leverage (×)"
          value={leverage}
          onChange={setLeverage}
          hint="Higher = closer liquidation"
        />
        <Field
          label="Maintenance margin (%)"
          value={mmPct}
          onChange={setMmPct}
          hint="Usually 0.5%–2% on majors. Check your exchange."
        />
      </div>

      <div
        className={`rounded-xl p-6 space-y-3 border-2 ${
          calc && calc.distancePct < 5
            ? "bg-red-950 border-red-700"
            : "bg-[var(--card)] border-amber-700"
        }`}
      >
        <h2 className="font-semibold">Liquidation</h2>
        {calc ? (
          <>
            <div className="text-center py-3">
              <p className="text-xs text-[var(--muted)] uppercase">Liquidation price</p>
              <p className="text-4xl font-bold text-red-400 mt-2">
                ${calc.liq.toFixed(4)}
              </p>
              <p className="text-sm text-[var(--muted)] mt-2">
                {calc.distancePct.toFixed(2)}% from entry
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <KV
                label="Initial margin"
                value={`${calc.initialMarginPct.toFixed(2)}%`}
              />
              <KV
                label="Safe buffer"
                value={`${calc.safeBuffer.toFixed(2)}%`}
                tone={calc.safeBuffer < 2 ? "bad" : "good"}
              />
            </div>
            <p className="text-xs text-[var(--muted)] pt-3 border-t border-[var(--card-border)]">
              Cross-margin liquidations can be further away than isolated.
              Funding rates eat into margin over time.
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            Enter valid inputs.
          </p>
        )}
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

function KV({
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
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded p-2">
      <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
      <p className={`font-mono font-semibold text-sm ${c}`}>{value}</p>
    </div>
  );
}
