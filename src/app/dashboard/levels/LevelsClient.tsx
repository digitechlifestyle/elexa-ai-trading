"use client";

import { useMemo, useState } from "react";

export default function LevelsClient() {
  const [high, setHigh] = useState("100");
  const [low, setLow] = useState("90");
  const [close, setClose] = useState("95");
  const [direction, setDirection] = useState<"up" | "down">("up");

  const calc = useMemo(() => {
    const H = Number(high) || 0;
    const L = Number(low) || 0;
    const C = Number(close) || 0;
    if (H <= 0 || L <= 0 || C <= 0 || H <= L) return null;

    // Classic pivot points
    const P = (H + L + C) / 3;
    const R1 = 2 * P - L;
    const S1 = 2 * P - H;
    const R2 = P + (H - L);
    const S2 = P - (H - L);
    const R3 = H + 2 * (P - L);
    const S3 = L - 2 * (H - P);

    // Camarilla pivots
    const range = H - L;
    const camR3 = C + range * 1.1 / 4;
    const camR2 = C + range * 1.1 / 6;
    const camR1 = C + range * 1.1 / 12;
    const camS1 = C - range * 1.1 / 12;
    const camS2 = C - range * 1.1 / 6;
    const camS3 = C - range * 1.1 / 4;

    // Fibonacci retracements / extensions
    // For uptrend (move from L to H): retracements 23.6%, 38.2%, 50%, 61.8%, 78.6%
    // For downtrend (move from H to L): same but reversed
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const fibExtensions = [1.272, 1.414, 1.618, 2.0, 2.618];

    const fibRetracements = fibLevels.map((f) => ({
      level: f,
      price:
        direction === "up"
          ? H - (H - L) * f
          : L + (H - L) * f,
    }));
    const fibExt = fibExtensions.map((f) => ({
      level: f,
      price:
        direction === "up"
          ? H + (H - L) * (f - 1)
          : L - (H - L) * (f - 1),
    }));

    return {
      pivot: { P, R1, R2, R3, S1, S2, S3 },
      camarilla: { camR1, camR2, camR3, camS1, camS2, camS3 },
      fibRetracements,
      fibExt,
    };
  }, [high, low, close, direction]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📐 Pivots &amp; Fibonacci Levels</h1>
        <p className="text-[var(--muted)] text-sm">
          Classic floor pivots, Camarilla pivots, and Fibonacci retracement /
          extension levels. The day-trader essentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Inputs</h2>
          <Field label="High" value={high} onChange={setHigh} />
          <Field label="Low" value={low} onChange={setLow} />
          <Field label="Close" value={close} onChange={setClose} />
          <div>
            <label className="block text-sm mb-1.5">Fib direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "up" | "down")}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="up">Uptrend (L → H)</option>
              <option value="down">Downtrend (H → L)</option>
            </select>
          </div>
        </div>

        {calc && (
          <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Classic Pivots</h2>
            <ul className="space-y-1 text-sm font-mono">
              <Row label="R3" value={calc.pivot.R3} tone="bad" />
              <Row label="R2" value={calc.pivot.R2} tone="bad" />
              <Row label="R1" value={calc.pivot.R1} tone="bad" />
              <Row label="P" value={calc.pivot.P} bold />
              <Row label="S1" value={calc.pivot.S1} tone="good" />
              <Row label="S2" value={calc.pivot.S2} tone="good" />
              <Row label="S3" value={calc.pivot.S3} tone="good" />
            </ul>
          </div>
        )}
      </div>

      {calc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Camarilla Pivots</h2>
            <ul className="space-y-1 text-sm font-mono">
              <Row label="H3" value={calc.camarilla.camR3} tone="bad" />
              <Row label="H2" value={calc.camarilla.camR2} tone="bad" />
              <Row label="H1" value={calc.camarilla.camR1} tone="bad" />
              <Row label="L1" value={calc.camarilla.camS1} tone="good" />
              <Row label="L2" value={calc.camarilla.camS2} tone="good" />
              <Row label="L3" value={calc.camarilla.camS3} tone="good" />
            </ul>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Fibonacci Retracements ({direction})</h2>
            <ul className="space-y-1 text-sm font-mono">
              {calc.fibRetracements.map((f) => (
                <li key={f.level} className="flex justify-between border-b border-[var(--card-border)] py-1">
                  <span className="text-[var(--muted)]">
                    {(f.level * 100).toFixed(1)}%
                  </span>
                  <span className="font-semibold">${f.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 md:col-span-2">
            <h2 className="font-semibold mb-3">Fibonacci Extensions (targets)</h2>
            <ul className="space-y-1 text-sm font-mono grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4">
              {calc.fibExt.map((f) => (
                <li
                  key={f.level}
                  className="flex justify-between border-b border-[var(--card-border)] py-1"
                >
                  <span className="text-[var(--muted)]">
                    {(f.level * 100).toFixed(1)}%
                  </span>
                  <span className="font-semibold text-green-400">
                    ${f.price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Pivot and Fib levels are self-fulfilling — they work because traders
        watch them. Confirm with price action. Not financial advice.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: number;
  tone?: "good" | "bad";
  bold?: boolean;
}) {
  const c = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <li className="flex justify-between border-b border-[var(--card-border)] py-1">
      <span className={`text-[var(--muted)] ${bold ? "font-bold text-white" : ""}`}>
        {label}
      </span>
      <span className={`${c} ${bold ? "font-bold" : ""}`}>${value.toFixed(2)}</span>
    </li>
  );
}
