"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

interface Summary {
  closed_trades: number; wins: number; losses: number;
  win_rate: number; total_pnl: number; avg_win: number; avg_loss: number;
  expectancy: number; profit_factor: number | null;
}
interface RBucket { label: string; count: number; pnl: number; }
interface HourBucket { hour: number; trades: number; wins: number; pnl: number; }
interface DowBucket { day: string; trades: number; wins: number; pnl: number; }
interface EquityPoint { date: string; equity: number; drawdown_pct: number; }

interface Data {
  summary: Summary;
  r_distribution: RBucket[];
  by_hour: HourBucket[];
  by_weekday: DowBucket[];
  equity_curve: EquityPoint[];
}

export default function TradeStatsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/trade-analytics");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setData(j);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Analysing trade history…</div>;
  if (err || !data) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;
  const { summary } = data;

  if (summary.closed_trades === 0) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">📈 Trade Stats</h1>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--muted)]">
          No closed trades yet. Open and close a paper position to populate stats.
        </div>
      </div>
    );
  }

  const hourActive = data.by_hour.filter((h) => h.trades > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📈 Trade Stats</h1>
        <p className="text-[var(--muted)] text-sm">
          FIFO-matched closed trades. Find where you make money and where you bleed.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Stat label="Closed trades" value={summary.closed_trades.toString()} />
        <Stat label="Win rate" value={`${summary.win_rate.toFixed(1)}%`}
          color={summary.win_rate >= 50 ? "text-green-400" : "text-red-400"} />
        <Stat label="Total P&L" value={`$${summary.total_pnl.toFixed(2)}`}
          color={summary.total_pnl >= 0 ? "text-green-400" : "text-red-400"} />
        <Stat label="Expectancy" value={`$${summary.expectancy.toFixed(2)}`}
          color={summary.expectancy >= 0 ? "text-green-400" : "text-red-400"} />
        <Stat label="Avg win" value={`$${summary.avg_win.toFixed(2)}`} color="text-green-400" />
        <Stat label="Avg loss" value={`$${summary.avg_loss.toFixed(2)}`} color="text-red-400" />
        <Stat label="Profit factor" value={summary.profit_factor != null ? summary.profit_factor.toFixed(2) : "—"}
          color={summary.profit_factor != null && summary.profit_factor >= 1.5 ? "text-green-400" : "text-amber-400"} />
        <Stat label="Wins / Losses" value={`${summary.wins} / ${summary.losses}`} />
      </div>

      {/* Equity curve */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-2">Equity curve + drawdown</h2>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <ComposedChart data={data.equity_curve}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[-100, 0]} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }}
                formatter={(v) => [`${Number(v).toFixed(2)}`, ""]} />
              <ReferenceLine yAxisId="left" y={0} stroke="#6b7280" />
              <Area yAxisId="right" type="monotone" dataKey="drawdown_pct" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              <Line yAxisId="left" type="monotone" dataKey="equity" stroke="#10b981" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* R distribution */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-2">Return distribution (per closed trade)</h2>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data.r_distribution}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }} />
              <Bar dataKey="count">
                {data.r_distribution.map((b, i) => (
                  <Cell key={i} fill={b.label.startsWith("<") || b.label.includes("-") && !b.label.startsWith("0") ? "#ef4444" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hour of day */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-2">P&L by hour (UTC)</h2>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={hourActive}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#6b7280" />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #374151" }} />
              <Bar dataKey="pnl">
                {hourActive.map((h, i) => (
                  <Cell key={i} fill={h.pnl >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold text-sm mb-3">By weekday</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr className="text-left border-b border-[var(--card-border)]">
              <th className="py-2 pr-3">Day</th>
              <th className="py-2 pr-3 text-right">Trades</th>
              <th className="py-2 pr-3 text-right">Wins</th>
              <th className="py-2 pr-3 text-right">Win rate</th>
              <th className="py-2 pr-3 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.by_weekday.filter((d) => d.trades > 0).map((d) => (
              <tr key={d.day} className="border-b border-[var(--card-border)] last:border-0">
                <td className="py-1.5 pr-3 font-semibold">{d.day}</td>
                <td className="py-1.5 pr-3 text-right font-mono">{d.trades}</td>
                <td className="py-1.5 pr-3 text-right font-mono">{d.wins}</td>
                <td className="py-1.5 pr-3 text-right font-mono">
                  {((d.wins / d.trades) * 100).toFixed(0)}%
                </td>
                <td className={`py-1.5 pr-3 text-right font-mono ${d.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ R-multiple here is decimal return (no logged stop). Hour is UTC. Research only.
      </div>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
