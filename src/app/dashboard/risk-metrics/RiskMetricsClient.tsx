"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface EquityPoint {
  date: string;
  pnl: number;
  cumulative: number;
}

interface Metrics {
  empty?: boolean;
  message?: string;
  days_active: number;
  total_pnl: number;
  mean_daily_pnl: number;
  daily_volatility: number;
  annualised_pnl: number;
  annualised_volatility: number;
  sharpe_annual: number;
  sortino_annual: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  drawdown_start: string | null;
  drawdown_end: string | null;
  best_day: number;
  worst_day: number;
  calmar: number;
  equity: EquityPoint[];
}

export default function RiskMetricsClient() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/risk-metrics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
        Computing risk metrics…
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">📐 Risk Metrics</h1>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          {data?.message ?? "No data."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📐 Risk Metrics</h1>
        <p className="text-[var(--muted)] text-sm">
          Sharpe, Sortino, Calmar, and drawdown — what hedge fund LPs look at.
          Based on your realised paper-trade P&amp;L.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Sharpe (ann.)"
          value={data.sharpe_annual.toFixed(2)}
          tone={data.sharpe_annual >= 1 ? "good" : data.sharpe_annual >= 0 ? "warn" : "bad"}
        />
        <Stat
          label="Sortino (ann.)"
          value={data.sortino_annual.toFixed(2)}
          tone={data.sortino_annual >= 1 ? "good" : data.sortino_annual >= 0 ? "warn" : "bad"}
        />
        <Stat
          label="Calmar"
          value={data.calmar.toFixed(2)}
          tone={data.calmar >= 1 ? "good" : "warn"}
        />
        <Stat
          label="Days active"
          value={String(data.days_active)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Total P&L"
          value={`$${data.total_pnl.toFixed(0)}`}
          tone={data.total_pnl >= 0 ? "good" : "bad"}
        />
        <Stat
          label="Mean daily P&L"
          value={`$${data.mean_daily_pnl.toFixed(2)}`}
          tone={data.mean_daily_pnl >= 0 ? "good" : "bad"}
        />
        <Stat label="Best day" value={`$${data.best_day.toFixed(0)}`} tone="good" />
        <Stat label="Worst day" value={`$${data.worst_day.toFixed(0)}`} tone="bad" />
      </div>

      <div className="bg-red-950 border border-red-800 rounded-xl p-5">
        <h2 className="font-semibold mb-3 text-red-200">⚠ Maximum drawdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-red-300 mb-1">Drawdown $</p>
            <p className="text-2xl font-bold text-red-400">
              -${data.max_drawdown.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-red-300 mb-1">Drawdown %</p>
            <p className="text-2xl font-bold text-red-400">
              -{data.max_drawdown_pct.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-red-300 mb-1">Period</p>
            <p className="text-sm text-red-100 mt-2">
              {data.drawdown_start ?? "—"} → {data.drawdown_end ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Cumulative P&amp;L</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.equity}>
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
            <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                background: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => `$${Number(v).toFixed(2)}`}
            />
            <ReferenceLine y={0} stroke="#fbbf24" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
        <h2 className="font-semibold mb-3">Interpretation</h2>
        <p><strong>Sharpe ≥ 1</strong>: Good risk-adjusted return. ≥ 2: Excellent. ≥ 3: Suspicious or genius.</p>
        <p><strong>Sortino</strong>: Like Sharpe but ignores upside volatility. Higher = better downside control.</p>
        <p><strong>Calmar</strong>: Annualised return / max drawdown. ≥ 1 implies you make back your worst drawdown in a year.</p>
        <p><strong>Max drawdown</strong>: The pain. If you can&apos;t stomach it psychologically, your strategy isn&apos;t actually yours.</p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Metrics derived from realised paper-trade P&amp;L. Small sample sizes
        produce unreliable Sharpe estimates — gather more history. Not financial advice.
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-green-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-red-400"
      : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
