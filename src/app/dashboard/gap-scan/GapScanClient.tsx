"use client";

import { useEffect, useState } from "react";

interface Gap {
  symbol: string;
  prev_close: number;
  current: number;
  gap_pct: number;
  intraday_chg_pct: number;
}

interface Data {
  gappers_up: Gap[];
  gappers_down: Gap[];
  all: Gap[];
}

export default function GapScanClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/gap-scan");
      const j = await res.json();
      if (res.ok) setData(j);
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">⏰ Gap Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          Stocks gapping up/down at the open relative to prior close. Filter
          for ≥0.2% gaps. Updates every 60s.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Scanning…
        </div>
      ) : (
        data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-950 border border-green-800 rounded-xl p-5">
              <h2 className="font-semibold text-green-200 mb-3">
                🟢 Gap up ({data.gappers_up.length})
              </h2>
              {data.gappers_up.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No gappers up.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.gappers_up.map((g) => (
                      <tr
                        key={g.symbol}
                        className="border-b border-green-900 last:border-0"
                      >
                        <td className="py-2 font-bold">{g.symbol}</td>
                        <td className="py-2 text-right text-xs text-[var(--muted)]">
                          ${g.prev_close.toFixed(2)} → ${g.current.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-green-400 font-semibold">
                          +{g.gap_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-red-950 border border-red-800 rounded-xl p-5">
              <h2 className="font-semibold text-red-200 mb-3">
                🔴 Gap down ({data.gappers_down.length})
              </h2>
              {data.gappers_down.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No gappers down.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.gappers_down.map((g) => (
                      <tr
                        key={g.symbol}
                        className="border-b border-red-900 last:border-0"
                      >
                        <td className="py-2 font-bold">{g.symbol}</td>
                        <td className="py-2 text-right text-xs text-[var(--muted)]">
                          ${g.prev_close.toFixed(2)} → ${g.current.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-red-400 font-semibold">
                          {g.gap_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
      )}

      {data && data.all.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
            Full list — gap + intraday
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Prev close</th>
                  <th className="text-right py-2 px-3">Current</th>
                  <th className="text-right py-2 px-3">Gap %</th>
                  <th className="text-right py-2 px-3">Intraday %</th>
                </tr>
              </thead>
              <tbody>
                {data.all.map((g) => (
                  <tr
                    key={g.symbol}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-2 px-3 font-medium">{g.symbol}</td>
                    <td className="py-2 px-3 text-right text-[var(--muted)]">
                      ${g.prev_close.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">${g.current.toFixed(2)}</td>
                    <td
                      className={`py-2 px-3 text-right font-semibold ${
                        g.gap_pct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {g.gap_pct >= 0 ? "+" : ""}
                      {g.gap_pct.toFixed(2)}%
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        g.intraday_chg_pct >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {g.intraday_chg_pct >= 0 ? "+" : ""}
                      {g.intraday_chg_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Gap-fill vs gap-and-go is a coin flip without context (volume, news,
        prior trend). Always confirm with the chart. Not financial advice.
      </div>
    </div>
  );
}
