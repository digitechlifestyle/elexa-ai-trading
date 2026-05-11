"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface DailyPoint {
  date: string;
  pnl: number;
  trades: number;
  cumulative: number;
}

interface SymbolStat {
  symbol: string;
  pnl: number;
  trades: number;
}

export default function AnalyticsCharts({
  daily,
  topSymbols,
  worstSymbols,
}: {
  daily: DailyPoint[];
  topSymbols: SymbolStat[];
  worstSymbols: SymbolStat[];
}) {
  return (
    <div className="space-y-8">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Cumulative P&amp;L</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No filled trades yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cumulative P&L"]}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Daily P&amp;L</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No filled trades yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Daily P&L"]}
              />
              <Bar dataKey="pnl">
                {daily.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.pnl >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Top winners</h2>
          {topSymbols.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No winning symbols yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topSymbols.map((s) => (
                <li
                  key={s.symbol}
                  className="flex justify-between items-center border-b border-[var(--card-border)] last:border-0 pb-2"
                >
                  <span className="font-medium">{s.symbol}</span>
                  <span className="text-right">
                    <span className="text-green-400 font-semibold">
                      +${s.pnl.toFixed(2)}
                    </span>
                    <span className="text-[var(--muted)] text-xs ml-2">
                      ({s.trades} trades)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Top losers</h2>
          {worstSymbols.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No losing symbols yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {worstSymbols.map((s) => (
                <li
                  key={s.symbol}
                  className="flex justify-between items-center border-b border-[var(--card-border)] last:border-0 pb-2"
                >
                  <span className="font-medium">{s.symbol}</span>
                  <span className="text-right">
                    <span className="text-red-400 font-semibold">
                      ${s.pnl.toFixed(2)}
                    </span>
                    <span className="text-[var(--muted)] text-xs ml-2">
                      ({s.trades} trades)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
