"use client";

import { useMemo, useState } from "react";

interface Buy {
  qty: string;
  price: string;
}

export default function DcaAvgTab() {
  const [buys, setBuys] = useState<Buy[]>([
    { qty: "1", price: "100" },
    { qty: "1", price: "90" },
  ]);
  const [currentPrice, setCurrentPrice] = useState("95");

  function add() {
    if (buys.length < 20) setBuys([...buys, { qty: "1", price: "100" }]);
  }
  function update(i: number, k: keyof Buy, v: string) {
    setBuys(buys.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)));
  }
  function remove(i: number) {
    if (buys.length > 1) setBuys(buys.filter((_, idx) => idx !== i));
  }

  const calc = useMemo(() => {
    const cur = Number(currentPrice) || 0;
    let totalQty = 0;
    let totalCost = 0;
    for (const b of buys) {
      const q = Number(b.qty) || 0;
      const p = Number(b.price) || 0;
      if (q > 0 && p > 0) {
        totalQty += q;
        totalCost += q * p;
      }
    }
    if (totalQty === 0) return null;
    const avg = totalCost / totalQty;
    const value = cur * totalQty;
    const pnl = value - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { totalQty, totalCost, avg, value, pnl, pnlPct };
  }, [buys, currentPrice]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Your buys</h2>
          <button
            onClick={add}
            disabled={buys.length >= 20}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded"
          >
            + Add buy
          </button>
        </div>
        <div className="space-y-2">
          {buys.map((b, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-[var(--muted)] w-6">#{i + 1}</span>
              <input
                type="number"
                step="any"
                value={b.qty}
                onChange={(e) => update(i, "qty", e.target.value)}
                placeholder="Qty"
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-[var(--muted)]">@</span>
              <input
                type="number"
                step="any"
                value={b.price}
                onChange={(e) => update(i, "price", e.target.value)}
                placeholder="Price"
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => remove(i)}
                disabled={buys.length <= 1}
                className="text-xs text-[var(--muted)] hover:text-red-400 disabled:opacity-30 px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm mb-1.5">Current price ($)</label>
          <input
            type="number"
            step="any"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Average position</h2>
        {calc ? (
          <>
            <div className="text-center py-3">
              <p className="text-xs text-[var(--muted)] uppercase">Average cost</p>
              <p className="text-4xl font-bold text-indigo-400 mt-2">
                ${calc.avg.toFixed(4)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <KV label="Total qty" value={calc.totalQty.toFixed(4)} />
              <KV label="Total cost" value={`$${calc.totalCost.toFixed(2)}`} />
              <KV label="Current value" value={`$${calc.value.toFixed(2)}`} />
              <KV
                label="Unrealised P&L"
                value={`${calc.pnl >= 0 ? "+" : ""}$${calc.pnl.toFixed(2)}`}
                tone={calc.pnl >= 0 ? "good" : "bad"}
              />
              <KV
                label="ROI %"
                value={`${calc.pnlPct >= 0 ? "+" : ""}${calc.pnlPct.toFixed(2)}%`}
                tone={calc.pnlPct >= 0 ? "good" : "bad"}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] text-center py-12">
            Add at least one buy.
          </p>
        )}
      </div>
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
