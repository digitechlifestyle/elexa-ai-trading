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
  date: string;
  net_m: number;
  walcl_m: number;
  tga_m: number;
  rrp_m: number;
}

interface Data {
  latest: Point | null;
  change_m: number | null;
  change_pct: number | null;
  series: Point[];
}

function tn(v: number) {
  return `$${(v / 1_000_000).toFixed(2)}T`;
}
function bn(v: number) {
  return `$${(v / 1_000).toFixed(0)}B`;
}

export default function LiquidityClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/net-liquidity")
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
        <h1 className="text-2xl font-bold mb-1">💧 Net Liquidity</h1>
        <p className="text-[var(--muted)] text-sm">
          Fed balance sheet (WALCL) minus Treasury General Account (TGA) minus
          Overnight Reverse Repo (RRP). Institutional traders watch this as a
          regime indicator for equity beta.
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

      {data && data.latest && (
        <>
          <div className="bg-[var(--card)] border-2 border-indigo-700 rounded-xl p-8 text-center">
            <p className="text-xs text-[var(--muted)] uppercase mb-2">
              Current Net Liquidity
            </p>
            <p className="text-6xl font-bold text-indigo-400">
              {tn(data.latest.net_m)}
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              As of {data.latest.date}
            </p>
            {data.change_pct != null && (
              <p
                className={`mt-3 text-sm font-semibold ${
                  data.change_pct >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {data.change_pct >= 0 ? "+" : ""}
                {data.change_pct.toFixed(2)}% over last ~month
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">Fed BS (WALCL)</p>
              <p className="text-xl font-bold text-green-400">+{tn(data.latest.walcl_m)}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">TGA (drain)</p>
              <p className="text-xl font-bold text-red-400">-{bn(data.latest.tga_m)}</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)] mb-1">RRP (drain)</p>
              <p className="text-xl font-bold text-red-400">-{bn(data.latest.rrp_m)}</p>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Trend — last 2 years</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.series}>
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
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}T`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => tn(Number(v))}
                />
                <Line
                  type="monotone"
                  dataKey="net_m"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Net liquidity correlates with risk-asset beta but is not a timing
        signal. Many drivers move independently. Source: FRED. Not financial
        advice.
      </div>
    </div>
  );
}
