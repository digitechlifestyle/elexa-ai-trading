"use client";

import { useState } from "react";
import ProfitTab from "./ProfitTab";
import DcaAvgTab from "./DcaAvgTab";
import LiquidationTab from "./LiquidationTab";
import CompoundTab from "./CompoundTab";

const TABS = [
  { id: "profit", label: "💰 Profit / Loss" },
  { id: "dca", label: "📊 DCA Average" },
  { id: "liq", label: "⚠️ Liquidation" },
  { id: "compound", label: "📈 Compound" },
];

export default function ProfitCalcClient() {
  const [tab, setTab] = useState("profit");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🧮 Profit Calculator Suite</h1>
        <p className="text-[var(--muted)] text-sm">
          Profit/loss, DCA average, liquidation price, and compound projection
          — everything in one place. Works for stocks, crypto, futures.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-[var(--muted)] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profit" && <ProfitTab />}
      {tab === "dca" && <DcaAvgTab />}
      {tab === "liq" && <LiquidationTab />}
      {tab === "compound" && <CompoundTab />}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Calculations assume standard fees and no slippage. Real outcomes
        vary. Leverage amplifies both gains and losses. Research only — not
        financial advice.
      </div>
    </div>
  );
}
