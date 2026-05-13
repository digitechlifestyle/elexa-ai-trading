"use client";

import { useState } from "react";

interface Holding {
  symbol: string;
  qty: number;
  cost_basis: number;
  current_price: number | null;
  weight_pct: number;
}

interface ReviewData {
  review: string;
  holdings: Holding[];
  total_value: number;
}

export default function PortfolioReviewClient() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/portfolio/review", { method: "POST" });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🧠 AI Portfolio Review</h1>
        <p className="text-[var(--muted)] text-sm">
          CEO Agent reviews your current paper holdings — overview, strengths,
          concerns, and suggested rebalances.
        </p>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
      >
        {loading ? "Reviewing…" : data ? "Re-run Review" : "Run AI Review"}
      </button>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">Total portfolio value</p>
            <p className="text-3xl font-bold">${data.total_value.toFixed(2)}</p>
          </div>

          {data.holdings.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
              <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
                Holdings
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                    <tr>
                      <th className="text-left py-2 px-3">Symbol</th>
                      <th className="text-right py-2 px-3">Qty</th>
                      <th className="text-right py-2 px-3">Current</th>
                      <th className="text-right py-2 px-3">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.holdings.map((h) => (
                      <tr
                        key={h.symbol}
                        className="border-b border-[var(--card-border)] last:border-0"
                      >
                        <td className="py-2 px-3 font-medium">{h.symbol}</td>
                        <td className="py-2 px-3 text-right">
                          {h.qty.toFixed(h.qty % 1 === 0 ? 0 : 4)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {h.current_price != null
                            ? `$${h.current_price.toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {h.weight_pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
              {data.review}
            </pre>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ AI review is research, not advice. Verify against your own thesis.
      </div>
    </div>
  );
}
