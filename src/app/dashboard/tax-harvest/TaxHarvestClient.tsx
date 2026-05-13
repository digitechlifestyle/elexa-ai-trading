"use client";

import { useEffect, useState } from "react";

interface Candidate {
  symbol: string;
  qty: number;
  avg_cost: number;
  current_price: number | null;
  unrealised_pl: number | null;
  unrealised_pl_pct: number | null;
  total_cost_basis: number;
  wash_sale_risk: boolean;
}

interface Data {
  empty?: boolean;
  candidates: Candidate[];
  total_unrealised_loss: number;
}

export default function TaxHarvestClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tax-harvest")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🧾 Tax Loss Harvesting</h1>
        <p className="text-[var(--muted)] text-sm">
          Find positions trading at a loss. Realising losses can offset capital
          gains. Wash-sale flag warns against re-buying within 30 days.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Scanning positions…
        </div>
      ) : !data || data.empty ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          No filled trades — nothing to analyse.
        </div>
      ) : data.candidates.length === 0 ? (
        <div className="bg-green-950 border border-green-800 rounded-xl p-8 text-center text-green-300">
          ✓ No positions trading at a loss right now. Nothing to harvest.
        </div>
      ) : (
        <>
          <div className="bg-red-950 border border-red-800 rounded-xl p-6 text-center">
            <p className="text-xs text-red-300 uppercase">Total unrealised loss</p>
            <p className="text-4xl font-bold text-red-400 mt-2">
              ${data.total_unrealised_loss.toFixed(2)}
            </p>
            <p className="text-xs text-red-200 mt-2">
              Realisable for tax-loss offset if positions are closed.
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
              Candidates ({data.candidates.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Qty</th>
                    <th className="text-right py-2 px-3">Avg cost</th>
                    <th className="text-right py-2 px-3">Current</th>
                    <th className="text-right py-2 px-3">Loss</th>
                    <th className="text-right py-2 px-3">Loss %</th>
                    <th className="text-left py-2 px-3">Wash sale</th>
                  </tr>
                </thead>
                <tbody>
                  {data.candidates.map((c) => (
                    <tr
                      key={c.symbol}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-2 px-3 font-bold">{c.symbol}</td>
                      <td className="py-2 px-3 text-right">{c.qty.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right">${c.avg_cost.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">
                        {c.current_price != null ? `$${c.current_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400 font-semibold">
                        ${c.unrealised_pl?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400">
                        {c.unrealised_pl_pct?.toFixed(2) ?? "—"}%
                      </td>
                      <td className="py-2 px-3">
                        {c.wash_sale_risk ? (
                          <span className="bg-amber-950 text-amber-300 text-xs px-2 py-0.5 rounded">
                            ⚠ recent buy
                          </span>
                        ) : (
                          <span className="text-green-400 text-xs">✓ clear</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Tax-loss harvesting rules vary by jurisdiction. IRS wash-sale rule
        disallows the loss if you repurchase &quot;substantially identical&quot;
        security within 30 days. Consult a tax advisor. Not financial advice.
      </div>
    </div>
  );
}
