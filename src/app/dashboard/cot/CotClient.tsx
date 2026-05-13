"use client";

import { useEffect, useState } from "react";

interface MarketRow {
  code: string;
  label: string;
  group: string;
  date: string | null;
  noncomm_long: number;
  noncomm_short: number;
  noncomm_net: number;
  comm_long: number;
  comm_short: number;
  comm_net: number;
  open_interest: number;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function CotClient() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cot")
      .then((r) => r.json())
      .then((d) => setMarkets(d.markets ?? []))
      .catch(() => setMarkets([]))
      .finally(() => setLoading(false));
  }, []);

  const groups = Array.from(new Set(markets.map((m) => m.group)));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📋 COT — Futures Positioning</h1>
        <p className="text-[var(--muted)] text-sm">
          Weekly Commitment of Traders report from the CFTC. Net positioning
          across non-commercial (specs) and commercial (hedgers). Updates
          Tuesdays for prior Friday.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading CFTC…
        </div>
      ) : (
        groups.map((g) => (
          <section key={g}>
            <h2 className="font-semibold mb-3">{g}</h2>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                    <tr>
                      <th className="text-left py-2 px-3">Market</th>
                      <th className="text-right py-2 px-3">Spec net</th>
                      <th className="text-right py-2 px-3">Hedger net</th>
                      <th className="text-right py-2 px-3">Open interest</th>
                      <th className="text-right py-2 px-3">Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets
                      .filter((m) => m.group === g)
                      .map((m) => (
                        <tr
                          key={m.code}
                          className="border-b border-[var(--card-border)] last:border-0"
                        >
                          <td className="py-2 px-3 font-medium">{m.label}</td>
                          <td
                            className={`py-2 px-3 text-right font-semibold ${
                              m.noncomm_net > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {m.noncomm_net >= 0 ? "+" : ""}
                            {fmt(m.noncomm_net)}
                          </td>
                          <td
                            className={`py-2 px-3 text-right ${
                              m.comm_net > 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {m.comm_net >= 0 ? "+" : ""}
                            {fmt(m.comm_net)}
                          </td>
                          <td className="py-2 px-3 text-right text-[var(--muted)]">
                            {fmt(m.open_interest)}
                          </td>
                          <td className="py-2 px-3 text-right text-xs text-[var(--muted)]">
                            {m.date ?? "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Positioning extremes can indicate sentiment crowding but don&apos;t
        time tops or bottoms. Source: CFTC Commitments of Traders. Research only —
        not financial advice.
      </div>
    </div>
  );
}
