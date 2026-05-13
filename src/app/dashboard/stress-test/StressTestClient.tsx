"use client";

import { useState } from "react";

interface Scenario {
  id: string;
  name: string;
  description: string;
}

interface ResultRow {
  scenario: Scenario;
  total_pnl: number;
  new_total: number;
  pnl_pct: number;
  breakdown: {
    symbol: string;
    class: string;
    old_value: number;
    new_value: number;
    shock_pct: number;
    pnl: number;
  }[];
}

interface Data {
  empty?: boolean;
  message?: string;
  holdings: { symbol: string; class: string; value: number }[];
  total_value: number;
  scenarios: ResultRow[];
}

export default function StressTestClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/stress-test", { method: "POST" });
      const j = await res.json();
      if (res.ok) setData(j);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⚠️ Portfolio Stress Test</h1>
        <p className="text-[var(--muted)] text-sm">
          Apply historical crisis shocks to your current positions. See where
          you&apos;d be after another 2008 / COVID / rate-shock scenario.
        </p>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
      >
        {loading ? "Running…" : data ? "Re-run Stress Test" : "Run Stress Test"}
      </button>

      {data?.empty && (
        <div className="bg-amber-950 border border-amber-800 text-amber-200 rounded-xl p-6 text-sm">
          {data.message}
        </div>
      )}

      {data && !data.empty && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">Current portfolio</p>
            <p className="text-2xl font-bold">${data.total_value.toFixed(2)}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {data.holdings.length} positions
            </p>
          </div>

          <div className="space-y-3">
            {data.scenarios.map((s) => {
              const isOpen = openId === s.scenario.id;
              return (
                <div
                  key={s.scenario.id}
                  className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : s.scenario.id)}
                    className="w-full p-4 text-left hover:bg-[var(--background)] transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{s.scenario.name}</p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {s.scenario.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            s.pnl_pct >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {s.pnl_pct >= 0 ? "+" : ""}
                          {s.pnl_pct.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {s.total_pnl >= 0 ? "+" : ""}${s.total_pnl.toFixed(2)} ·
                          New: ${s.new_total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--card-border)] p-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                          <tr>
                            <th className="text-left py-2 px-2">Symbol</th>
                            <th className="text-left py-2 px-2">Class</th>
                            <th className="text-right py-2 px-2">Old value</th>
                            <th className="text-right py-2 px-2">Shock</th>
                            <th className="text-right py-2 px-2">New value</th>
                            <th className="text-right py-2 px-2">P&amp;L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.breakdown.map((b) => (
                            <tr
                              key={b.symbol}
                              className="border-b border-[var(--card-border)] last:border-0"
                            >
                              <td className="py-2 px-2 font-medium">{b.symbol}</td>
                              <td className="py-2 px-2 text-xs text-[var(--muted)] capitalize">
                                {b.class}
                              </td>
                              <td className="py-2 px-2 text-right">${b.old_value.toFixed(2)}</td>
                              <td
                                className={`py-2 px-2 text-right ${
                                  b.shock_pct >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {b.shock_pct >= 0 ? "+" : ""}
                                {b.shock_pct}%
                              </td>
                              <td className="py-2 px-2 text-right">${b.new_value.toFixed(2)}</td>
                              <td
                                className={`py-2 px-2 text-right font-semibold ${
                                  b.pnl >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {b.pnl >= 0 ? "+" : ""}${b.pnl.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Stress test applies broad asset-class shocks based on historical
        precedent. Real outcomes vary by individual security. Single-factor
        approximation. Research only — not financial advice.
      </div>
    </div>
  );
}
