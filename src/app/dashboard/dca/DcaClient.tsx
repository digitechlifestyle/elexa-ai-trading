"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface EquityPoint {
  date: string;
  invested: number;
  value: number;
  shares: number;
}

interface DcaResult {
  symbol: string;
  cadence: string;
  amountPerBuy: number;
  years: number;
  total_buys: number;
  total_invested: number;
  total_shares: number;
  final_value: number;
  final_price: number;
  avg_cost: number;
  total_pnl: number;
  total_pnl_pct: number;
  cagr: number;
  lumpsum_value: number;
  lumpsum_pnl_pct: number;
  equity: EquityPoint[];
}

export default function DcaClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [years, setYears] = useState("5");
  const [amount, setAmount] = useState("500");
  const [cadence, setCadence] = useState<"weekly" | "biweekly" | "monthly">(
    "monthly"
  );
  const [data, setData] = useState<DcaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/dca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          years: Number(years),
          amount: Number(amount),
          cadence,
        }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📅 DCA Simulator</h1>
        <p className="text-[var(--muted)] text-sm">
          What if you&apos;d dollar-cost averaged into this symbol on a schedule?
          Comparison vs lump-sum baseline.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            min={1}
            max={10}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">$ per buy</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Cadence</label>
          <select
            value={cadence}
            onChange={(e) =>
              setCadence(e.target.value as "weekly" | "biweekly" | "monthly")
            }
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
        >
          {loading ? "Simulating…" : "Run DCA Simulation"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total invested" value={`$${data.total_invested.toFixed(0)}`} />
            <Stat
              label="Final value"
              value={`$${data.final_value.toFixed(0)}`}
              tone={data.final_value >= data.total_invested ? "good" : "bad"}
            />
            <Stat
              label="DCA P&L"
              value={`${data.total_pnl_pct >= 0 ? "+" : ""}${data.total_pnl_pct.toFixed(1)}%`}
              tone={data.total_pnl_pct >= 0 ? "good" : "bad"}
            />
            <Stat
              label="CAGR"
              value={`${data.cagr >= 0 ? "+" : ""}${data.cagr.toFixed(1)}%`}
              tone={data.cagr >= 0 ? "good" : "bad"}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total shares" value={data.total_shares.toFixed(4)} />
            <Stat label="Average cost" value={`$${data.avg_cost.toFixed(2)}`} />
            <Stat label="Final price" value={`$${data.final_price.toFixed(2)}`} />
            <Stat label="Total buys" value={String(data.total_buys)} />
          </div>

          <div
            className={`rounded-xl p-5 border ${
              data.total_pnl_pct >= data.lumpsum_pnl_pct
                ? "bg-green-950 border-green-800"
                : "bg-amber-950 border-amber-800"
            }`}
          >
            <h2 className="font-semibold mb-2">
              vs Lump-sum at start
            </h2>
            <p className="text-sm">
              Lump-sum return:{" "}
              <span
                className={
                  data.lumpsum_pnl_pct >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"
                }
              >
                {data.lumpsum_pnl_pct >= 0 ? "+" : ""}
                {data.lumpsum_pnl_pct.toFixed(1)}%
              </span>{" "}
              · DCA return:{" "}
              <span
                className={
                  data.total_pnl_pct >= 0
                    ? "text-green-400 font-bold"
                    : "text-red-400 font-bold"
                }
              >
                {data.total_pnl_pct >= 0 ? "+" : ""}
                {data.total_pnl_pct.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              DCA usually loses to lump-sum in bull markets but reduces regret
              and drawdown risk in volatile periods.
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Equity curve</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.equity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      year: "2-digit",
                      month: "short",
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
                  formatter={(v) => `$${Number(v).toFixed(0)}`}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  dot={false}
                  name="Invested"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Past performance doesn&apos;t predict future returns. DCA reduces
        timing risk, not market risk. Not financial advice.
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
  tone?: "good" | "bad";
}) {
  const c = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
