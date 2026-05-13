"use client";

import { useMemo, useState } from "react";

export default function ProfitTab() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("100");
  const [exit, setExit] = useState("110");
  const [size, setSize] = useState("1000");
  const [sizeMode, setSizeMode] = useState<"qty" | "usd">("usd");
  const [leverage, setLeverage] = useState("1");
  const [feePct, setFeePct] = useState("0.1");

  const calc = useMemo(() => {
    const e = Number(entry) || 0;
    const x = Number(exit) || 0;
    const s = Number(size) || 0;
    const lev = Math.max(1, Number(leverage) || 1);
    const fee = (Number(feePct) || 0) / 100;
    if (e <= 0 || x <= 0 || s <= 0) return null;

    // Resolve qty + notional
    const notionalAtEntry = sizeMode === "qty" ? s * e : s;
    const qty = sizeMode === "qty" ? s : s / e;
    const margin = notionalAtEntry / lev;

    // Price move
    const priceDelta = side === "long" ? x - e : e - x;
    const priceDeltaPct = (priceDelta / e) * 100;

    // Gross PnL (with leverage applied via notional)
    const grossPnl = qty * priceDelta;

    // Fees — entry + exit (both legs at notional)
    const fees = notionalAtEntry * fee + qty * x * fee;
    const netPnl = grossPnl - fees;

    // ROI on margin (leveraged returns)
    const roiOnMargin = margin > 0 ? (netPnl / margin) * 100 : 0;
    // ROI on notional (unleveraged equivalent)
    const roiOnNotional = (netPnl / notionalAtEntry) * 100;

    // Breakeven price (after fees)
    // fee at entry already paid. For round trip: exit needs to cover fee at exit + entry fee per unit
    // Approximation: breakeven = entry × (1 + 2*fee) for long, × (1 − 2*fee) for short
    const breakeven =
      side === "long"
        ? e * (1 + 2 * fee)
        : e * (1 - 2 * fee);

    return {
      qty,
      notionalAtEntry,
      margin,
      priceDelta,
      priceDeltaPct,
      grossPnl,
      fees,
      netPnl,
      roiOnMargin,
      roiOnNotional,
      breakeven,
    };
  }, [side, entry, exit, size, sizeMode, leverage, feePct]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Trade details</h2>

        <div className="flex gap-2">
          <button
            type="button"
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
            type="button"
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
        <Field label="Exit price ($)" value={exit} onChange={setExit} />

        <div>
          <label className="block text-sm mb-1.5">Position size</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
            <select
              value={sizeMode}
              onChange={(e) => setSizeMode(e.target.value as "qty" | "usd")}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="usd">$ notional</option>
              <option value="qty">Quantity</option>
            </select>
          </div>
        </div>

        <Field label="Leverage (×)" value={leverage} onChange={setLeverage} hint="1 = spot, 10 = 10× futures" />
        <Field label="Fee per side (%)" value={feePct} onChange={setFeePct} hint="0.1% typical exchange taker fee" />
      </div>

      <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Result</h2>
        {calc ? (
          <>
            <div className="text-center py-3">
              <p className="text-xs text-[var(--muted)] uppercase">Net P&L</p>
              <p
                className={`text-5xl font-bold mt-2 ${
                  calc.netPnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {calc.netPnl >= 0 ? "+" : ""}${calc.netPnl.toFixed(2)}
              </p>
              <p
                className={`text-sm font-semibold mt-1 ${
                  calc.roiOnMargin >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                ROI: {calc.roiOnMargin >= 0 ? "+" : ""}
                {calc.roiOnMargin.toFixed(2)}% on margin ·{" "}
                {calc.roiOnNotional >= 0 ? "+" : ""}
                {calc.roiOnNotional.toFixed(2)}% on notional
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <KV label="Qty" value={calc.qty.toFixed(6)} />
              <KV label="Notional" value={`$${calc.notionalAtEntry.toFixed(2)}`} />
              <KV label="Margin" value={`$${calc.margin.toFixed(2)}`} />
              <KV
                label="Price move"
                value={`${calc.priceDelta >= 0 ? "+" : ""}${calc.priceDelta.toFixed(
                  2
                )} (${calc.priceDeltaPct >= 0 ? "+" : ""}${calc.priceDeltaPct.toFixed(
                  2
                )}%)`}
              />
              <KV label="Gross P&L" value={`$${calc.grossPnl.toFixed(2)}`} />
              <KV label="Total fees" value={`-$${calc.fees.toFixed(2)}`} />
              <KV
                label="Breakeven price"
                value={`$${calc.breakeven.toFixed(4)}`}
              />
            </div>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded p-2">
      <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
      <p className="font-mono font-semibold text-sm">{value}</p>
    </div>
  );
}
