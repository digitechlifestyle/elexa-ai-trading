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

interface Data {
  ratio: number | null;
  classification: { label: string; tone: "good" | "warn" | "bad" } | null;
  mcap_bn: number | null;
  gdp_bn: number | null;
  mcap_date: string | null;
  gdp_date: string | null;
  history: { date: string; ratio: number }[];
}

export default function BuffettClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/buffett")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setErr(j.error ?? "Failed");
        else setData(j);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  const toneColor =
    data?.classification?.tone === "good"
      ? "text-green-400"
      : data?.classification?.tone === "warn"
      ? "text-amber-400"
      : data?.classification?.tone === "bad"
      ? "text-red-400"
      : "";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📏 Buffett Indicator</h1>
        <p className="text-[var(--muted)] text-sm">
          Total US market cap (Wilshire 5000) divided by GDP. Warren Buffett
          called it &quot;probably the best single measure of where valuations stand
          at any given moment.&quot;
        </p>
      </div>

      {err && (
        <div className="bg-amber-950 border border-amber-800 text-amber-200 rounded-xl p-4 text-sm">
          {err}. Requires FRED_API_KEY env var.
        </div>
      )}
      {loading && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading…
        </div>
      )}

      {data && (
        <>
          <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-8 text-center">
            <p className="text-xs text-[var(--muted)] uppercase mb-2">
              Buffett indicator
            </p>
            <p className={`text-7xl font-bold ${toneColor}`}>
              {data.ratio != null ? `${data.ratio.toFixed(1)}%` : "—"}
            </p>
            <p className={`mt-3 text-lg font-semibold ${toneColor}`}>
              {data.classification?.label ?? "—"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">
                Wilshire 5000 (price full cap, $B)
              </p>
              <p className="text-2xl font-bold">
                {data.mcap_bn != null
                  ? `$${(data.mcap_bn / 1000).toFixed(2)}T`
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                as of {data.mcap_date ?? "—"}
              </p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">
                GDP (nominal, annualised $B)
              </p>
              <p className="text-2xl font-bold">
                {data.gdp_bn != null
                  ? `$${(data.gdp_bn / 1000).toFixed(2)}T`
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                as of {data.gdp_date ?? "—"}
              </p>
            </div>
          </div>

          {data.history.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
              <h2 className="font-semibold mb-4">History (last ~10 years)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.history}>
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
                    formatter={(v) => `${Number(v).toFixed(1)}%`}
                  />
                  <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Under", fill: "#22c55e", fontSize: 10 }} />
                  <ReferenceLine y={115} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Fair", fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine y={135} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Over", fill: "#ef4444", fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-3">Interpretation guide</h2>
            <ul className="text-sm space-y-1">
              <li>
                <span className="text-green-400 font-semibold">&lt;75%:</span> Significantly undervalued
              </li>
              <li>
                <span className="text-green-400 font-semibold">75–90%:</span> Modestly undervalued
              </li>
              <li>
                <span className="text-amber-400 font-semibold">90–115%:</span> Fair value zone
              </li>
              <li>
                <span className="text-red-400 font-semibold">115–135%:</span> Modestly overvalued
              </li>
              <li>
                <span className="text-red-400 font-semibold">&gt;135%:</span> Significantly overvalued
              </li>
            </ul>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Long-term valuation context. Can stay elevated for years. Not a timing tool.
        Source: FRED. Research only — not financial advice.
      </div>
    </div>
  );
}
