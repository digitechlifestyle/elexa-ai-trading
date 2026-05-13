"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Point {
  value: number;
  label: string;
  date: string;
}

function classify(v: number): { label: string; color: string } {
  if (v < 25) return { label: "Extreme Fear", color: "text-red-500" };
  if (v < 45) return { label: "Fear", color: "text-orange-400" };
  if (v < 55) return { label: "Neutral", color: "text-amber-400" };
  if (v < 75) return { label: "Greed", color: "text-lime-400" };
  return { label: "Extreme Greed", color: "text-green-400" };
}

export default function SentimentClient() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentiment")
      .then((r) => r.json())
      .then((d) => {
        const pts = (d.points ?? []).reverse(); // newest last for chart
        setPoints(pts);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  const latest = points[points.length - 1];
  const klass = latest ? classify(latest.value) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">😱 Sentiment Index</h1>
        <p className="text-[var(--muted)] text-sm">
          Crypto Fear &amp; Greed (Alternative.me) — contrarian indicator. Extreme
          fear often marks bottoms; extreme greed often marks tops. Historically.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading…
        </div>
      ) : !latest ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Sentiment data unavailable.
        </div>
      ) : (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
              Crypto Fear &amp; Greed — today
            </p>
            <p className={`text-7xl font-bold ${klass!.color}`}>
              {latest.value}
            </p>
            <p className={`mt-2 text-lg font-semibold ${klass!.color}`}>
              {klass!.label}
            </p>
            <p className="text-xs text-[var(--muted)] mt-3">
              {new Date(latest.date).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">30-day history</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => Number(v).toString()}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--muted)] mt-3 text-center">
              Red line: Extreme Fear (≤25) · Green line: Extreme Greed (≥75)
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Sentiment is a context indicator. Markets can stay fearful or greedy
        for extended periods. Research only — not financial advice. Source:{" "}
        <a
          href="https://alternative.me/crypto/fear-and-greed-index/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-100"
        >
          alternative.me
        </a>
      </div>
    </div>
  );
}
