"use client";

import { useEffect, useState } from "react";

const COMMON = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY"];

export default function FxClient() {
  const [base, setBase] = useState("USD");
  const [amount, setAmount] = useState("1000");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(b: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/fx?base=${b}`);
      const j = await res.json();
      setRates(j.rates ?? {});
      setDate(j.date ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(base);
  }, [base]);

  const amt = Number(amount) || 0;
  const entries = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">💱 Currency Converter</h1>
        <p className="text-[var(--muted)] text-sm">
          ECB reference rates via Frankfurter. Daily update. 30+ pairs.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Amount</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">From</label>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
            >
              {COMMON.concat(Object.keys(rates))
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort()
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">
          As of {date ?? "—"} · {loading ? "loading…" : `${entries.length} pairs`}
        </p>
      </div>

      {entries.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-2 px-3">Currency</th>
                  <th className="text-right py-2 px-3">Rate</th>
                  <th className="text-right py-2 px-3">{amt.toLocaleString()} {base} =</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([ccy, rate]) => (
                  <tr
                    key={ccy}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-2 px-3 font-bold">{ccy}</td>
                    <td className="py-2 px-3 text-right font-mono text-[var(--muted)]">
                      {rate.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {(amt * rate).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} {ccy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ ECB reference rates differ from retail/exchange rates by 1–3%. Don&apos;t
        rely on this for actual settlements.
      </div>
    </div>
  );
}
