"use client";

import { useEffect, useState } from "react";

interface Row {
  symbol: string;
  current: number;
  high_52w: number;
  low_52w: number;
  pct_from_high: number;
  pct_from_low: number;
  range_position: number;
}

interface Data {
  results: Row[];
  near_highs: Row[];
  near_lows: Row[];
}

export default function Scan52wClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scan-52w")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setErr(j.error ?? "Failed");
        else setData(j);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📈 52-Week Range Scanner</h1>
        <p className="text-[var(--muted)] text-sm">
          Stocks within 3% of 52-week extremes. Breakout watch (near highs) or
          reversal hunt (near lows). Universe: 50 majors + sector ETFs.
        </p>
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {loading && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Scanning universe…
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-950 border border-green-800 rounded-xl p-6">
              <h2 className="font-semibold text-green-200 mb-3">
                🚀 Near 52-week highs ({data.near_highs.length})
              </h2>
              {data.near_highs.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">None right now.</p>
              ) : (
                <ul className="space-y-2 text-sm max-h-80 overflow-y-auto">
                  {data.near_highs.map((r) => (
                    <li
                      key={r.symbol}
                      className="flex justify-between items-center border-b border-green-900 last:border-0 py-1.5"
                    >
                      <span className="font-bold">{r.symbol}</span>
                      <span className="text-xs text-[var(--muted)]">
                        ${r.current.toFixed(2)}
                      </span>
                      <span className="text-xs text-green-300 font-mono">
                        {r.pct_from_high.toFixed(2)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-red-950 border border-red-800 rounded-xl p-6">
              <h2 className="font-semibold text-red-200 mb-3">
                💀 Near 52-week lows ({data.near_lows.length})
              </h2>
              {data.near_lows.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">None right now.</p>
              ) : (
                <ul className="space-y-2 text-sm max-h-80 overflow-y-auto">
                  {data.near_lows.map((r) => (
                    <li
                      key={r.symbol}
                      className="flex justify-between items-center border-b border-red-900 last:border-0 py-1.5"
                    >
                      <span className="font-bold">{r.symbol}</span>
                      <span className="text-xs text-[var(--muted)]">
                        ${r.current.toFixed(2)}
                      </span>
                      <span className="text-xs text-red-300 font-mono">
                        +{r.pct_from_low.toFixed(2)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <h2 className="font-semibold p-4 border-b border-[var(--card-border)]">
              Full universe — sorted by range position
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Current</th>
                    <th className="text-right py-2 px-3">52w high</th>
                    <th className="text-right py-2 px-3">52w low</th>
                    <th className="text-right py-2 px-3">From high</th>
                    <th className="text-right py-2 px-3">From low</th>
                    <th className="text-right py-2 px-3">Range pos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr
                      key={r.symbol}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-2 px-3 font-medium">{r.symbol}</td>
                      <td className="py-2 px-3 text-right">
                        ${r.current.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-400">
                        ${r.high_52w.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400">
                        ${r.low_52w.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-xs">
                        {r.pct_from_high.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right text-xs">
                        +{r.pct_from_low.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {(r.range_position * 100).toFixed(0)}
                          </span>
                          <div className="w-16 h-1.5 bg-[var(--background)] rounded">
                            <div
                              className="h-full bg-indigo-600 rounded"
                              style={{
                                width: `${r.range_position * 100}%`,
                              }}
                            />
                          </div>
                        </div>
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
        ⚠️ 52-week extremes are context, not signals. Confirm with volume,
        breadth, and trend. Research only.
      </div>
    </div>
  );
}
