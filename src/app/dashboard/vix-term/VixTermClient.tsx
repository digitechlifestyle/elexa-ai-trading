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
} from "recharts";

interface Point {
  label: string;
  days: number;
  value: number | null;
  date: string | null;
}

interface Data {
  points: Point[];
  vix_vix3m_ratio: number | null;
  regime: "contango" | "flat" | "backwardation" | "unknown";
}

export default function VixTermClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vix-term")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setErr(j.error ?? "Failed");
        else setData(j);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  const regimeColor =
    data?.regime === "contango"
      ? "text-green-400"
      : data?.regime === "backwardation"
      ? "text-red-400"
      : "text-amber-400";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 VIX Term Structure</h1>
        <p className="text-[var(--muted)] text-sm">
          The volatility curve. Contango (front &lt; back) = calm markets.
          Backwardation (front &gt; back) = stress, often near tops or panic
          lows. Hedge funds size by this.
        </p>
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {loading && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading Yahoo Finance…
        </div>
      )}

      {data && (
        <>
          <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-8 text-center">
            <p className="text-xs text-[var(--muted)] uppercase mb-2">Regime</p>
            <p className={`text-5xl font-bold ${regimeColor}`}>
              {data.regime}
            </p>
            <p className="text-sm text-[var(--muted)] mt-3">
              VIX / VIX3M ratio:{" "}
              <span className="font-mono">
                {data.vix_vix3m_ratio != null
                  ? data.vix_vix3m_ratio.toFixed(3)
                  : "—"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.points.map((p) => (
              <div
                key={p.label}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
              >
                <p className="text-xs text-[var(--muted)] mb-1">{p.label} VIX</p>
                <p className="text-2xl font-bold">
                  {p.value != null ? p.value.toFixed(2) : "—"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  as of {p.date ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Curve shape</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.points.filter((p) => p.value != null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => Number(v).toFixed(2)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
            <h2 className="font-semibold mb-2">How traders use this</h2>
            <p>
              <strong className="text-green-400">Contango</strong>: Long
              volatility ETFs (VXX) bleed value over time. Often risk-on
              equity bias.
            </p>
            <p>
              <strong className="text-red-400">Backwardation</strong>: Spike
              hedges become expensive but pay off. Often near short-term
              equity bottoms once panic peaks.
            </p>
            <p>
              <strong className="text-amber-400">Flat</strong>: Indecision.
              Markets waiting for catalyst.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Source: Yahoo Finance free API. Subject to rate limits. Term
        structure is one of many vol indicators. Not financial advice.
      </div>
    </div>
  );
}
