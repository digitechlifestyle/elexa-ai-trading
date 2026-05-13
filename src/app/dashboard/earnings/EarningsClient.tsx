"use client";

import { useEffect, useState } from "react";

interface Row {
  symbol: string;
  company: string;
  date: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  surprise_pct: number | null;
}

interface Data {
  window_days: number;
  by_date: Record<string, Row[]>;
}

export default function EarningsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");

  async function load(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/earnings?days=${d}`);
      const j = await res.json();
      if (res.ok) setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(Number(days));
  }, [days]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📅 Earnings Calendar</h1>
        <p className="text-[var(--muted)] text-sm">
          Upcoming and recent earnings reports with surprise %. Source: Yahoo
          Finance. Earnings days = elevated implied vol.
        </p>
      </div>

      <div className="flex gap-2">
        {["3", "7", "14"].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded text-sm ${
              days === d
                ? "bg-indigo-600 text-white"
                : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
            }`}
          >
            Next {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading earnings…
        </div>
      ) : (
        data &&
        Object.entries(data.by_date).map(([date, rows]) => (
          <div
            key={date}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden"
          >
            <h2 className="font-semibold p-3 border-b border-[var(--card-border)] flex justify-between items-center">
              <span>
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {rows.length} report{rows.length === 1 ? "" : "s"}
              </span>
            </h2>
            {rows.length === 0 ? (
              <p className="text-sm text-[var(--muted)] p-4">No earnings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                    <tr>
                      <th className="text-left py-2 px-3">Symbol</th>
                      <th className="text-left py-2 px-3">Company</th>
                      <th className="text-right py-2 px-3">EPS est.</th>
                      <th className="text-right py-2 px-3">EPS actual</th>
                      <th className="text-right py-2 px-3">Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={`${r.symbol}-${i}`}
                        className="border-b border-[var(--card-border)] last:border-0"
                      >
                        <td className="py-2 px-3 font-bold">
                          <a
                            href={`/dashboard/charts?symbol=${r.symbol}`}
                            className="hover:text-indigo-400"
                          >
                            {r.symbol}
                          </a>
                        </td>
                        <td className="py-2 px-3 text-[var(--muted)]">{r.company}</td>
                        <td className="py-2 px-3 text-right">
                          {r.eps_estimate != null ? `$${r.eps_estimate.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {r.eps_actual != null ? `$${r.eps_actual.toFixed(2)}` : "—"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            r.surprise_pct == null
                              ? ""
                              : r.surprise_pct >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {r.surprise_pct != null
                            ? `${r.surprise_pct >= 0 ? "+" : ""}${r.surprise_pct.toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Earnings introduce gap risk. Use defined-risk strategies around
        reports. Source: Yahoo Finance. Research only — not financial advice.
      </div>
    </div>
  );
}
