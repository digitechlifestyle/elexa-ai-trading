"use client";

import { useEffect, useState } from "react";

interface Account {
  status: string; currency: string;
  cash: number; equity: number; last_equity: number;
  buying_power: number; portfolio_value: number;
  daytrade_count: number; pattern_day_trader: boolean;
  day_pnl: number; day_pnl_pct: number;
}
interface Position {
  symbol: string; side: string; qty: number;
  avg_entry: number; current_price: number;
  market_value: number; unrealised_pl: number; unrealised_pl_pct: number;
}

export default function AccountClient() {
  const [data, setData] = useState<{ account: Account; positions: Position[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/alpaca-account");
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading Alpaca account…</div>;
  if (err || !data) return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">🏦 Alpaca Account</h1>
      <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>
    </div>
  );

  const a = data.account;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🏦 Alpaca Paper Account</h1>
          <p className="text-[var(--muted)] text-sm">
            Live snapshot from Alpaca paper trading API.
            Status: <span className="font-mono">{a.status}</span> · {a.currency}
          </p>
        </div>
        <button onClick={load} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Stat label="Equity" value={`$${a.equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} bold />
        <Stat label="Day P&L"
          value={`${a.day_pnl >= 0 ? "+" : ""}$${a.day_pnl.toFixed(2)} (${a.day_pnl_pct >= 0 ? "+" : ""}${a.day_pnl_pct.toFixed(2)}%)`}
          color={a.day_pnl >= 0 ? "text-green-400" : "text-red-400"} />
        <Stat label="Cash" value={`$${a.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="Buying power" value={`$${a.buying_power.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="Portfolio value" value={`$${a.portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Stat label="Day trades (5d)" value={`${a.daytrade_count} / 3`}
          color={a.daytrade_count >= 3 ? "text-red-400" : ""} />
        <Stat label="PDT flagged" value={a.pattern_day_trader ? "Yes" : "No"}
          color={a.pattern_day_trader ? "text-red-400" : "text-green-400"} />
        <Stat label="Positions" value={data.positions.length.toString()} />
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Open positions</h2>
        {data.positions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No open positions.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--muted)]">
              <tr className="text-left border-b border-[var(--card-border)]">
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3">Side</th>
                <th className="py-2 pr-3 text-right">Qty</th>
                <th className="py-2 pr-3 text-right">Entry</th>
                <th className="py-2 pr-3 text-right">Current</th>
                <th className="py-2 pr-3 text-right">Mkt value</th>
                <th className="py-2 pr-3 text-right">Unrealised P&L</th>
                <th className="py-2 pr-3 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p) => (
                <tr key={p.symbol} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold">{p.symbol}</td>
                  <td className="py-2 pr-3 text-xs">{p.side}</td>
                  <td className="py-2 pr-3 text-right font-mono">{p.qty}</td>
                  <td className="py-2 pr-3 text-right font-mono">${p.avg_entry.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${p.current_price.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${p.market_value.toFixed(2)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${p.unrealised_pl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {p.unrealised_pl >= 0 ? "+" : ""}${p.unrealised_pl.toFixed(2)}
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${p.unrealised_pl_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {p.unrealised_pl_pct >= 0 ? "+" : ""}{p.unrealised_pl_pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">⚠️ Paper trading account. Simulated only.</div>
    </div>
  );
}

function Stat({ label, value, color = "", bold = false }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`${bold ? "text-xl" : "text-lg"} font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
