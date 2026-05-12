"use client";

import { useEffect, useState } from "react";

interface LeaderRow {
  user_id: string;
  display_name: string;
  pnl: number;
  trades: number;
  win_rate: number;
  first_trade: string;
}

const PERIODS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

export default function LeaderboardClient() {
  const [period, setPeriod] = useState("30d");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.id
                ? "bg-indigo-600 text-white"
                : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-[var(--muted)] text-sm text-center py-12">
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-[var(--muted)] text-sm text-center py-12">
            No opted-in traders yet for this period. Be the first — sign up and
            opt in from Settings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Trader</th>
                  <th className="text-right py-3 px-4">P&amp;L</th>
                  <th className="text-right py-3 px-4">Trades</th>
                  <th className="text-right py-3 px-4">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.user_id}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-3 px-4 font-bold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td className="py-3 px-4 font-medium">{r.display_name}</td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${
                        r.pnl >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--muted)]">{r.trades}</td>
                    <td className="py-3 px-4 text-right text-[var(--muted)]">
                      {r.win_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
