"use client";

import { useState } from "react";

const INDICATORS = [
  { id: "rsi", label: "RSI(14)" },
  { id: "sma_fast", label: "SMA fast" },
  { id: "sma_slow", label: "SMA slow" },
  { id: "price", label: "Close price" },
];
const OPS_VALUE = [
  { id: "lt", label: "<" },
  { id: "lte", label: "≤" },
  { id: "gt", label: ">" },
  { id: "gte", label: "≥" },
];
const OPS_CROSS = [
  { id: "crosses_above", label: "crosses above" },
  { id: "crosses_below", label: "crosses below" },
];

interface Rule {
  indicator: string;
  op: string;
  value: string;
  compare_to: string;
}

const DEFAULT_BUY: Rule = {
  indicator: "rsi",
  op: "lt",
  value: "30",
  compare_to: "sma_slow",
};
const DEFAULT_SELL: Rule = {
  indicator: "rsi",
  op: "gt",
  value: "70",
  compare_to: "sma_slow",
};

export default function StrategyBuilderClient() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState("180");
  const [cash, setCash] = useState("10000");
  const [smaFast, setSmaFast] = useState("10");
  const [smaSlow, setSmaSlow] = useState("30");
  const [rsiP, setRsiP] = useState("14");
  const [buy, setBuy] = useState<Rule>(DEFAULT_BUY);
  const [sell, setSell] = useState<Rule>(DEFAULT_SELL);
  const [result, setResult] = useState<{
    final_pnl_pct: number;
    buy_hold_pnl_pct: number;
    total_trades: number;
    win_rate_pct: number;
    trades: { date: string; side: string; price: number; reason: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function ruleToConfig(r: Rule) {
    return {
      indicator: r.indicator,
      op: r.op,
      value: r.op.startsWith("crosses") ? undefined : Number(r.value),
      compare_to: r.op.startsWith("crosses") ? r.compare_to : undefined,
    };
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          strategy: "custom",
          days: Number(days),
          starting_cash: Number(cash),
          custom_config: {
            sma_fast_period: Number(smaFast),
            sma_slow_period: Number(smaSlow),
            rsi_period: Number(rsiP),
            buy_rule: ruleToConfig(buy),
            sell_rule: ruleToConfig(sell),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Backtest failed");
      else setResult(data.result);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  function RuleEditor({
    rule,
    onChange,
    label,
  }: {
    rule: Rule;
    onChange: (r: Rule) => void;
    label: string;
  }) {
    const isCross = rule.op.startsWith("crosses");
    return (
      <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rule.indicator}
            onChange={(e) => onChange({ ...rule, indicator: e.target.value })}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded px-2 py-1 text-sm"
          >
            {INDICATORS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
          <select
            value={rule.op}
            onChange={(e) => onChange({ ...rule, op: e.target.value })}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded px-2 py-1 text-sm"
          >
            <optgroup label="Value">
              {OPS_VALUE.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cross">
              {OPS_CROSS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          </select>
          {isCross ? (
            <select
              value={rule.compare_to}
              onChange={(e) => onChange({ ...rule, compare_to: e.target.value })}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded px-2 py-1 text-sm"
            >
              {INDICATORS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              step="any"
              value={rule.value}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded px-2 py-1 text-sm w-24"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🛠 Strategy Builder</h1>
        <p className="text-[var(--muted)] text-sm">
          Build a custom rules-based strategy. Backtest on historical bars.
          Pro feature.
        </p>
      </div>

      <form
        onSubmit={run}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Symbol" value={symbol} onChange={setSymbol} />
          <Input label="Days back" value={days} onChange={setDays} type="number" />
          <Input label="Starting cash" value={cash} onChange={setCash} type="number" />
          <div className="grid grid-cols-3 gap-1">
            <Input label="SMA fast" value={smaFast} onChange={setSmaFast} type="number" small />
            <Input label="SMA slow" value={smaSlow} onChange={setSmaSlow} type="number" small />
            <Input label="RSI" value={rsiP} onChange={setRsiP} type="number" small />
          </div>
        </div>

        <RuleEditor rule={buy} onChange={setBuy} label="BUY when" />
        <RuleEditor rule={sell} onChange={setSell} label="SELL when" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
        >
          {loading ? "Running…" : "Run Custom Backtest"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Strategy P&L"
              value={`${result.final_pnl_pct >= 0 ? "+" : ""}${result.final_pnl_pct.toFixed(2)}%`}
              tone={result.final_pnl_pct >= 0 ? "good" : "bad"}
            />
            <Stat
              label="Buy & Hold"
              value={`${result.buy_hold_pnl_pct >= 0 ? "+" : ""}${result.buy_hold_pnl_pct.toFixed(2)}%`}
            />
            <Stat label="Trades" value={String(result.total_trades)} />
            <Stat label="Win rate" value={`${result.win_rate_pct.toFixed(0)}%`} />
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Trade log</h2>
            {result.trades.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No trades — strategy never triggered.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)] sticky top-0 bg-[var(--card)]">
                    <tr>
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Side</th>
                      <th className="text-right py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                        <td className="py-2 px-2 text-[var(--muted)] text-xs">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td
                          className={`py-2 px-2 ${
                            t.side === "buy" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {t.side.toUpperCase()}
                        </td>
                        <td className="py-2 px-2 text-right">${t.price.toFixed(2)}</td>
                        <td className="py-2 px-2 text-xs text-[var(--muted)]">{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  small,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  small?: boolean;
}) {
  return (
    <div>
      <label className={`block text-${small ? "[10px]" : "xs"} text-[var(--muted)] mb-1`}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-600"
      />
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
  const color = tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
