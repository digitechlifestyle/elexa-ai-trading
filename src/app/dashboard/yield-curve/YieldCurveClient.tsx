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

interface Point {
  label: string;
  years: number;
  yield: number | null;
  date: string | null;
}

interface CurveData {
  points: Point[];
  spread_10_2: number | null;
  spread_10_3m: number | null;
  inverted_10_2: boolean;
  inverted_10_3m: boolean;
}

export default function YieldCurveClient() {
  const [data, setData] = useState<CurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/yield-curve")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setErr(j.error ?? "Failed");
        else setData(j);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📐 US Treasury Yield Curve</h1>
        <p className="text-[var(--muted)] text-sm">
          Full curve from 1M to 30Y. An inverted curve (short rates above long
          rates) historically precedes recessions by 12-18 months.
        </p>
      </div>

      {err && (
        <div className="bg-amber-950 border border-amber-800 text-amber-200 rounded-xl p-4 text-sm">
          {err}. Set <code className="bg-[var(--background)] px-1 rounded">FRED_API_KEY</code> in Vercel.
        </div>
      )}
      {loading && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading FRED…
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              className={`rounded-xl p-4 border ${
                data.inverted_10_2
                  ? "bg-red-950 border-red-700"
                  : "bg-[var(--card)] border-[var(--card-border)]"
              }`}
            >
              <p className="text-xs text-[var(--muted)] mb-1">10Y-2Y spread</p>
              <p
                className={`text-2xl font-bold ${
                  data.inverted_10_2 ? "text-red-400" : "text-green-400"
                }`}
              >
                {data.spread_10_2 != null
                  ? `${data.spread_10_2 >= 0 ? "+" : ""}${data.spread_10_2.toFixed(2)}%`
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data.inverted_10_2 ? "⚠️ Inverted" : "Normal"}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${
                data.inverted_10_3m
                  ? "bg-red-950 border-red-700"
                  : "bg-[var(--card)] border-[var(--card-border)]"
              }`}
            >
              <p className="text-xs text-[var(--muted)] mb-1">10Y-3M spread</p>
              <p
                className={`text-2xl font-bold ${
                  data.inverted_10_3m ? "text-red-400" : "text-green-400"
                }`}
              >
                {data.spread_10_3m != null
                  ? `${data.spread_10_3m >= 0 ? "+" : ""}${data.spread_10_3m.toFixed(2)}%`
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data.inverted_10_3m ? "⚠️ Inverted (NY Fed model)" : "Normal"}
              </p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">As of</p>
              <p className="text-2xl font-bold">
                {data.points[0]?.date ?? "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">FRED daily</p>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Curve shape</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={data.points.filter((p) => p.yield != null)}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={11}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => `${Number(v).toFixed(2)}%`}
                />
                <ReferenceLine y={0} stroke="#374151" />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">All tenors</h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--muted)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="text-left py-2">Tenor</th>
                  <th className="text-right py-2">Yield</th>
                  <th className="text-right py-2">As of</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((p) => (
                  <tr
                    key={p.label}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="py-2 font-medium">{p.label}</td>
                    <td className="py-2 text-right font-mono">
                      {p.yield != null ? `${p.yield.toFixed(2)}%` : "—"}
                    </td>
                    <td className="py-2 text-right text-xs text-[var(--muted)]">
                      {p.date ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Inversion does not time recessions — lag has been 6-24 months
        historically. Source: FRED. Research only — not financial advice.
      </div>
    </div>
  );
}
