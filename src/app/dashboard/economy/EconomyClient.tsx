"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface Obs {
  date: string;
  value: number | null;
}

interface Series {
  id: string;
  label: string;
  unit: string;
  latest: Obs | null;
  prior: Obs | null;
  change_pct: number | null;
  history: Obs[];
}

export default function EconomyClient() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fred")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setErr(data.error ?? "Failed");
        } else {
          setSeries(data.series ?? []);
        }
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🏦 Economic Indicators</h1>
        <p className="text-[var(--muted)] text-sm">
          Macro fundamentals from FRED (St. Louis Fed). Updated daily. The data
          banks watch.
        </p>
      </div>

      {err && (
        <div className="bg-amber-950 border border-amber-800 text-amber-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold">FRED not configured.</p>
          <p>{err}</p>
          <p className="text-xs">
            Set <code className="bg-[var(--background)] px-1 rounded">FRED_API_KEY</code>{" "}
            in Vercel env vars. Free key:{" "}
            <a
              href="https://fred.stlouisfed.org/docs/api/api_key.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-100"
            >
              fred.stlouisfed.org
            </a>
            .
          </p>
        </div>
      )}

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading FRED…
        </div>
      ) : series.length === 0 && !err ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          No data.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="text-xs text-[var(--muted)]">{s.label}</p>
                  <p className="font-mono text-[10px] text-[var(--muted)]">{s.id}</p>
                </div>
                {s.change_pct != null && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      s.change_pct >= 0
                        ? "bg-green-950 text-green-400"
                        : "bg-red-950 text-red-400"
                    }`}
                  >
                    {s.change_pct >= 0 ? "+" : ""}
                    {s.change_pct.toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">
                {s.latest?.value != null
                  ? `${s.unit === "$" ? "$" : ""}${s.latest.value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}${s.unit !== "$" ? s.unit : ""}`
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                as of {s.latest?.date ?? "—"}
              </p>
              {s.history.length >= 3 && (
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.history}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={
                          s.change_pct != null && s.change_pct >= 0
                            ? "#22c55e"
                            : "#ef4444"
                        }
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Macro data describes the past. Markets price the future. Cross-reference
        with sentiment and price action. Source: FRED. Not financial advice.
      </div>
    </div>
  );
}
