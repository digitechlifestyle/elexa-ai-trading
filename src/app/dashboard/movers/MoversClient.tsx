"use client";

import { useEffect, useState } from "react";

interface Mover {
  symbol: string;
  current: number;
  prev_close: number;
  change_pct: number;
  volume: number;
}

interface Data {
  gainers: Mover[];
  losers: Mover[];
  all: Mover[];
}

function fmtVol(v: number): string {
  if (v > 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v > 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v > 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

export default function MoversClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/top-movers");
      const j = await res.json();
      if (res.ok) {
        setData(j);
        setUpdatedAt(new Date().toLocaleTimeString());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🚀 Top Movers Today</h1>
          <p className="text-[var(--muted)] text-sm">
            Largest 1-day moves across 65+ liquid stocks, ETFs, and crypto.
            Refreshes every 60s.
          </p>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {loading ? "Refreshing…" : updatedAt ? `Updated ${updatedAt}` : ""}
        </p>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-950 border border-green-800 rounded-xl p-5">
              <h2 className="font-semibold text-green-200 mb-3">
                🟢 Top gainers
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {data.gainers.map((m) => (
                    <tr
                      key={m.symbol}
                      className="border-b border-green-900 last:border-0"
                    >
                      <td className="py-2 font-bold">{m.symbol}</td>
                      <td className="py-2 text-right">${m.current.toFixed(2)}</td>
                      <td className="py-2 text-right text-green-400 font-semibold">
                        +{m.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-2 text-right text-xs text-[var(--muted)]">
                        {fmtVol(m.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-red-950 border border-red-800 rounded-xl p-5">
              <h2 className="font-semibold text-red-200 mb-3">
                🔴 Top losers
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {data.losers.map((m) => (
                    <tr
                      key={m.symbol}
                      className="border-b border-red-900 last:border-0"
                    >
                      <td className="py-2 font-bold">{m.symbol}</td>
                      <td className="py-2 text-right">${m.current.toFixed(2)}</td>
                      <td className="py-2 text-right text-red-400 font-semibold">
                        {m.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-2 text-right text-xs text-[var(--muted)]">
                        {fmtVol(m.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
              Full universe ({data.all.length} symbols)
            </h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)] text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Price</th>
                    <th className="text-right py-2 px-3">Prev</th>
                    <th className="text-right py-2 px-3">Change</th>
                    <th className="text-right py-2 px-3">Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.all.map((m) => (
                    <tr
                      key={m.symbol}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-2 px-3 font-medium">{m.symbol}</td>
                      <td className="py-2 px-3 text-right">
                        ${m.current.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-[var(--muted)]">
                        ${m.prev_close.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          m.change_pct >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {m.change_pct >= 0 ? "+" : ""}
                        {m.change_pct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-right text-xs text-[var(--muted)]">
                        {fmtVol(m.volume)}
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
        ⚠️ Universe is curated. Real screeners scan thousands. Volume can lag in
        crypto. Not financial advice.
      </div>
    </div>
  );
}
