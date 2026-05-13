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
  ReferenceLine,
} from "recharts";

export default function DrawdownRecoveryClient() {
  const [drawdownPct, setDrawdownPct] = useState("20");
  const [annualReturnPct, setAnnualReturnPct] = useState("8");

  const calc = useMemo(() => {
    const dd = Number(drawdownPct) || 0;
    const ann = Number(annualReturnPct) || 0;
    if (dd <= 0 || ann <= 0 || dd >= 100) return null;

    // From a -X% drawdown, need to make Y% back to break even
    const requiredGainPct = (1 / (1 - dd / 100) - 1) * 100;

    // Years to recover at annual return rate
    // (1 + ann)^t = required → t = ln(required) / ln(1 + ann)
    const required = 1 / (1 - dd / 100);
    const yearsToRecover = Math.log(required) / Math.log(1 + ann / 100);

    // Build recovery path year by year
    const series: { year: number; equity: number }[] = [];
    const start = 100 * (1 - dd / 100);
    let equity = start;
    for (let y = 0; y <= Math.ceil(yearsToRecover) + 2; y++) {
      series.push({ year: y, equity });
      equity = equity * (1 + ann / 100);
    }

    // Standard reference table — common drawdowns
    const table = [10, 20, 30, 40, 50, 60, 75, 90].map((d) => ({
      dd: d,
      required: (1 / (1 - d / 100) - 1) * 100,
      yearsAt8: Math.log(1 / (1 - d / 100)) / Math.log(1.08),
    }));

    return {
      requiredGainPct,
      yearsToRecover,
      series,
      table,
    };
  }, [drawdownPct, annualReturnPct]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📉 Drawdown Recovery Calculator</h1>
        <p className="text-[var(--muted)] text-sm">
          The asymmetric math of losses. A 50% loss requires a 100% gain to
          break even. Visualise the climb-back at your assumed return rate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Inputs</h2>
          <div>
            <label className="block text-sm mb-1.5">Drawdown experienced (%)</label>
            <input
              type="number"
              step="any"
              value={drawdownPct}
              onChange={(e) => setDrawdownPct(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Annual return assumed (%)</label>
            <input
              type="number"
              step="any"
              value={annualReturnPct}
              onChange={(e) => setAnnualReturnPct(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="bg-[var(--card)] border-2 border-red-700 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">The pain</h2>
          {calc ? (
            <>
              <div>
                <p className="text-xs text-[var(--muted)]">Required gain to break even</p>
                <p className="text-4xl font-bold text-red-400 mt-1">
                  +{calc.requiredGainPct.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">
                  Years to recover at {annualReturnPct}%/yr
                </p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {calc.yearsToRecover.toFixed(1)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Enter valid drawdown and return.
            </p>
          )}
        </div>
      </div>

      {calc && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Recovery path</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={calc.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="year"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `Y${v}`}
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
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-2 text-center">
              Green dashed line = starting equity ($100). Indigo = path back.
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Reference table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="text-left py-2 px-2">Drawdown</th>
                    <th className="text-right py-2 px-2">Required gain to recover</th>
                    <th className="text-right py-2 px-2">Years at 8%/yr</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.table.map((r) => (
                    <tr
                      key={r.dd}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="py-2 px-2 text-red-400 font-semibold">
                        -{r.dd}%
                      </td>
                      <td className="py-2 px-2 text-right text-green-400 font-semibold">
                        +{r.required.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-amber-400">
                        {r.yearsAt8.toFixed(1)} yr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Math is exact. Real recovery depends on your behaviour during the
        drawdown. Many investors don&apos;t hold for the recovery. Not financial
        advice.
      </div>
    </div>
  );
}
