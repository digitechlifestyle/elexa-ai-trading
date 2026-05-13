"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Action = "buy" | "sell";
type Type = "call" | "put" | "stock";

interface Leg {
  id: number;
  action: Action;
  type: Type;
  strike: string;
  premium: string;
  qty: string;
}

const PRESETS: Record<string, Leg[]> = {
  long_call: [
    { id: 1, action: "buy", type: "call", strike: "100", premium: "5", qty: "1" },
  ],
  long_put: [
    { id: 1, action: "buy", type: "put", strike: "100", premium: "5", qty: "1" },
  ],
  short_call: [
    { id: 1, action: "sell", type: "call", strike: "100", premium: "5", qty: "1" },
  ],
  long_straddle: [
    { id: 1, action: "buy", type: "call", strike: "100", premium: "5", qty: "1" },
    { id: 2, action: "buy", type: "put", strike: "100", premium: "5", qty: "1" },
  ],
  bull_call_spread: [
    { id: 1, action: "buy", type: "call", strike: "100", premium: "5", qty: "1" },
    { id: 2, action: "sell", type: "call", strike: "110", premium: "2", qty: "1" },
  ],
  iron_condor: [
    { id: 1, action: "sell", type: "put", strike: "90", premium: "2", qty: "1" },
    { id: 2, action: "buy", type: "put", strike: "85", premium: "1", qty: "1" },
    { id: 3, action: "sell", type: "call", strike: "110", premium: "2", qty: "1" },
    { id: 4, action: "buy", type: "call", strike: "115", premium: "1", qty: "1" },
  ],
  covered_call: [
    { id: 1, action: "buy", type: "stock", strike: "0", premium: "100", qty: "100" },
    { id: 2, action: "sell", type: "call", strike: "110", premium: "3", qty: "1" },
  ],
};

function legPayoff(leg: Leg, spot: number): number {
  const strike = Number(leg.strike) || 0;
  const premium = Number(leg.premium) || 0;
  const qty = Number(leg.qty) || 0;
  // Options are usually 100 multiplier per contract. Stock is 1x per share.
  const mult = leg.type === "stock" ? 1 : 100;
  let intrinsic = 0;
  if (leg.type === "call") intrinsic = Math.max(spot - strike, 0);
  else if (leg.type === "put") intrinsic = Math.max(strike - spot, 0);
  else if (leg.type === "stock") intrinsic = spot - premium; // stock entry = premium
  if (leg.type === "stock") {
    return (spot - premium) * qty;
  }
  const sign = leg.action === "buy" ? 1 : -1;
  // P&L per contract: sign * (intrinsic − premium)
  return sign * (intrinsic - premium) * qty * mult;
}

export default function OptionsPayoffClient() {
  const [legs, setLegs] = useState<Leg[]>(PRESETS.long_call);

  const range = useMemo(() => {
    const strikes = legs
      .filter((l) => l.type !== "stock")
      .map((l) => Number(l.strike) || 0);
    if (strikes.length === 0) return { min: 50, max: 150 };
    const minK = Math.min(...strikes);
    const maxK = Math.max(...strikes);
    const center = (minK + maxK) / 2;
    const span = Math.max(maxK - minK, center * 0.3, 20);
    return {
      min: Math.max(0, center - span),
      max: center + span,
    };
  }, [legs]);

  const points = useMemo(() => {
    const steps = 80;
    const arr: { spot: number; pnl: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const spot = range.min + ((range.max - range.min) * i) / steps;
      const pnl = legs.reduce((s, l) => s + legPayoff(l, spot), 0);
      arr.push({ spot, pnl });
    }
    return arr;
  }, [legs, range]);

  function update(id: number, k: keyof Leg, v: string) {
    setLegs(legs.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  }
  function remove(id: number) {
    if (legs.length > 1) setLegs(legs.filter((l) => l.id !== id));
  }
  function add() {
    const nextId = Math.max(...legs.map((l) => l.id)) + 1;
    setLegs([
      ...legs,
      { id: nextId, action: "buy", type: "call", strike: "100", premium: "5", qty: "1" },
    ]);
  }

  // Find breakevens — where pnl crosses zero
  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if ((a.pnl < 0 && b.pnl > 0) || (a.pnl > 0 && b.pnl < 0)) {
      // Linear interpolate
      const slope = (b.pnl - a.pnl) / (b.spot - a.spot);
      const root = a.spot - a.pnl / slope;
      breakevens.push(root);
    }
  }
  const maxProfit = Math.max(...points.map((p) => p.pnl));
  const maxLoss = Math.min(...points.map((p) => p.pnl));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📈 Options Payoff Diagram</h1>
        <p className="text-[var(--muted)] text-sm">
          Build multi-leg option strategies. Visualise expiration P&amp;L,
          breakevens, max profit/loss. Standard 100-multiplier per contract.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <p className="text-xs text-[var(--muted)] mb-2">Presets:</p>
        <div className="flex gap-1 flex-wrap">
          {Object.keys(PRESETS).map((k) => (
            <button
              key={k}
              onClick={() => setLegs(PRESETS[k].map((l, i) => ({ ...l, id: i + 1 })))}
              className="text-xs bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-2.5 py-1.5 rounded"
            >
              {k.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Legs</h2>
          <button
            onClick={add}
            disabled={legs.length >= 8}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded"
          >
            + Add leg
          </button>
        </div>
        <div className="space-y-2">
          {legs.map((l) => (
            <div key={l.id} className="flex flex-wrap gap-2 items-center">
              <select
                value={l.action}
                onChange={(e) => update(l.id, "action", e.target.value)}
                className={`bg-[var(--background)] border rounded px-2 py-1.5 text-sm ${
                  l.action === "buy" ? "border-green-700" : "border-red-700"
                }`}
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
              <select
                value={l.type}
                onChange={(e) => update(l.id, "type", e.target.value)}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm"
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
                <option value="stock">Stock</option>
              </select>
              {l.type !== "stock" && (
                <input
                  type="number"
                  step="any"
                  value={l.strike}
                  onChange={(e) => update(l.id, "strike", e.target.value)}
                  placeholder="Strike"
                  className="w-20 bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm"
                />
              )}
              <input
                type="number"
                step="any"
                value={l.premium}
                onChange={(e) => update(l.id, "premium", e.target.value)}
                placeholder={l.type === "stock" ? "Cost basis" : "Premium"}
                className="w-24 bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                step="any"
                value={l.qty}
                onChange={(e) => update(l.id, "qty", e.target.value)}
                placeholder="Qty"
                className="w-20 bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => remove(l.id)}
                disabled={legs.length <= 1}
                className="text-xs text-[var(--muted)] hover:text-red-400 disabled:opacity-30 px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat
          label="Max profit"
          value={maxProfit > 100_000 ? "Unlimited" : `$${maxProfit.toFixed(2)}`}
          tone="good"
        />
        <Stat
          label="Max loss"
          value={maxLoss < -100_000 ? "Unlimited" : `$${maxLoss.toFixed(2)}`}
          tone="bad"
        />
        <Stat
          label="Breakeven(s)"
          value={
            breakevens.length === 0
              ? "—"
              : breakevens.map((b) => `$${b.toFixed(2)}`).join(", ")
          }
        />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Payoff at expiration</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="spot"
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => `$${Number(v).toFixed(2)}`}
              labelFormatter={(v) => `Spot $${Number(v).toFixed(2)}`}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Payoff shown at expiration. Pre-expiry P&amp;L curves are smoother
        due to extrinsic value. Assumes European-style settlement. Real options
        have early-exercise premium + dividends. Educational.
      </div>
    </div>
  );
}

function Stat({
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
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
