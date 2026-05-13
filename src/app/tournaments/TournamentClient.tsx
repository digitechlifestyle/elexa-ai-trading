"use client";

import { useEffect, useState } from "react";

interface Row {
  user_id: string;
  display_name: string;
  pnl: number;
  trades: number;
  win_rate: number;
}

export default function TournamentClient({
  period,
  archived,
}: {
  period: "this_month" | "last_month";
  archived?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&limit=20`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)] text-sm">
        Loading…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)] text-sm">
        {archived
          ? "No opted-in traders ran this month."
          : "No opted-in traders yet this month. Be first."}
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
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
                <td className="py-3 px-4 font-medium">
                  <a
                    href={`/u/${encodeURIComponent(r.display_name)}`}
                    className="hover:text-indigo-400"
                  >
                    {r.display_name}
                  </a>
                </td>
                <td
                  className={`py-3 px-4 text-right font-semibold ${
                    r.pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-[var(--muted)]">{r.trades}</td>
                <td className="py-3 px-4 text-right text-[var(--muted)]">{r.win_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
