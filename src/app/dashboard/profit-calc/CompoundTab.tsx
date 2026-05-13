"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function CompoundTab() {
  const [initial, setInitial] = useState("10000");
  const [monthly, setMonthly] = useState("500");
  const [annualPct, setAnnualPct] = useState("10");
  const [years, setYears] = useState("10");

  const calc = useMemo(() => {
    const P = Number(initial) || 0;
    const m = Number(monthly) || 0;
    const r = (Number(annualPct) || 0) / 100;
    const t = Number(years) || 0;
    if (P < 0 || t <= 0 || r < -0.99) return null;

    const monthlyRate = r / 12;
    const totalMonths = Math.floor(t * 12);
    const series: { month: number; value: number; contributed: number }[] = [];
    let value = P;
    let contributed = P;
    series.push({ month: 0, value, contributed });
    for (let i = 1; i <= totalMonths; i++) {
      value = value * (1 + monthlyRate) + m;
      contributed += m;
      if (i % 12 === 0 || i === totalMonths) {
        series.push({ month: i, value, contributed });
      }
    }
    const totalGain = value - contributed;
    return { final: value, contributed, totalGain, series };
  }, [initial, monthly, annualPct, years]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Inputs</h2>
          <Field label="Initial investment ($)" value={initial} onChange={setInitial} />
          <Field
            label="Monthly contribution ($)"
            value={monthly}
            onChange={setMonthly}
            hint="0 = no recurring deposits"
          />
          <Field
            label="Annual return (%)"
            value={annualPct}
            onChange={setAnnualPct}
            hint="Historical SPX ≈ 10%, T-bills ≈ 4%"
          />
          <Field label="Years" value={years} onChange={setYears} />
        </div>

        <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Final balance</h2>
          {calc ? (
            <>
              <div className="text-center py-3">
                <p className="text-xs text-[var(--muted)] uppercase">After {years} years</p>
                <p className="text-4xl font-bold text-indigo-400 mt-2">
                  ${calc.final.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <KV
                  label="Total contributed"
                  value={`$${calc.contributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
                <KV
                  label="Compound gain"
                  value={`$${calc.totalGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  tone="good"
                />
                <KV
                  label="Multiplier"
                  value={`${(calc.final / Math.max(calc.contributed, 1)).toFixed(2)}x`}
                />
                <KV
                  label="Effective CAGR"
                  value={`${annualPct}%`}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)] text-center py-12">
              Enter valid inputs.
            </p>
          )}
        </div>
      </div>

      {calc && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Growth trajectory</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={calc.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(m) => `Y${Math.floor(m / 12)}`}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => `$${Number(v).toFixed(0)}`}
                labelFormatter={(m) =>
                  `Year ${(Number(m) / 12).toFixed(1)}`
                }
              />
              <Line
                type="monotone"
                dataKey="contributed"
                stroke="#9ca3af"
                strokeWidth={2}
                dot={false}
                name="Contributed"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Balance"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-[var(--muted)] mt-3 text-center">
            Grey: principal contributed. Indigo: total balance with compound growth.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1.5">{label}</label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
      />
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </div>
  );
}

function KV({
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
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded p-2">
      <p className="text-[10px] text-[var(--muted)] uppercase">{label}</p>
      <p className={`font-mono font-semibold text-sm ${c}`}>{value}</p>
    </div>
  );
}
