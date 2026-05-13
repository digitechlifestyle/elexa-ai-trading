"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from "recharts";

interface Sector {
  symbol: string;
  label: string;
  rs_ratio: number;
  rs_momentum: number;
  quadrant: "leading" | "weakening" | "lagging" | "improving";
}

const QUADRANT_COLOR = {
  leading: "#22c55e",
  weakening: "#fbbf24",
  improving: "#3b82f6",
  lagging: "#ef4444",
};

export default function SectorsClient() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rrg")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setErr(j.error ?? "Failed");
        else setSectors(j.sectors ?? []);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  // Compute scatter bounds for axis
  const ratios = sectors.map((s) => s.rs_ratio);
  const moms = sectors.map((s) => s.rs_momentum);
  const minR = Math.min(95, ...ratios);
  const maxR = Math.max(105, ...ratios);
  const minM = Math.min(95, ...moms);
  const maxM = Math.max(105, ...moms);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🔄 Sector Rotation (RRG)</h1>
        <p className="text-[var(--muted)] text-sm">
          Relative Rotation Graph vs SPY. Sectors rotate counterclockwise
          through 4 quadrants: improving → leading → weakening → lagging.
          Buy improving + leading. Sell weakening + lagging.
        </p>
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {loading && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Computing RRG…
        </div>
      )}

      {sectors.length > 0 && (
        <>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis
                  type="number"
                  dataKey="rs_ratio"
                  domain={[minR - 1, maxR + 1]}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => v.toFixed(1)}
                >
                  <Label value="RS Ratio →" position="bottom" fill="#9ca3af" fontSize={11} />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="rs_momentum"
                  domain={[minM - 1, maxM + 1]}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickFormatter={(v) => v.toFixed(1)}
                >
                  <Label
                    value="RS Momentum ↑"
                    angle={-90}
                    position="left"
                    fill="#9ca3af"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{
                    background: "#12121a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => Number(v).toFixed(2)}
                  cursor={{ stroke: "#374151" }}
                />
                <ReferenceLine x={100} stroke="#374151" />
                <ReferenceLine y={100} stroke="#374151" />
                <Scatter data={sectors}>
                  {sectors.map((s, i) => (
                    <Cell key={i} fill={QUADRANT_COLOR[s.quadrant]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-xs mt-2 text-[var(--muted)]">
              <span>← Weaker than SPY</span>
              <span>Stronger than SPY →</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["leading", "improving", "weakening", "lagging"] as const).map((q) => (
              <div
                key={q}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
              >
                <p
                  className="text-xs uppercase font-semibold mb-2"
                  style={{ color: QUADRANT_COLOR[q] }}
                >
                  {q}
                </p>
                <ul className="space-y-1 text-sm">
                  {sectors
                    .filter((s) => s.quadrant === q)
                    .map((s) => (
                      <li key={s.symbol} className="flex justify-between">
                        <span className="font-medium">{s.symbol}</span>
                        <span className="text-[var(--muted)] text-xs">
                          {s.label}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
            <h2 className="font-semibold mb-2">RRG quadrant playbook</h2>
            <p>
              <strong style={{ color: QUADRANT_COLOR.improving }}>
                Improving
              </strong>: early opportunity, momentum building, RS still below SPY.
            </p>
            <p>
              <strong style={{ color: QUADRANT_COLOR.leading }}>Leading</strong>:
              outperforming + accelerating. Hold.
            </p>
            <p>
              <strong style={{ color: QUADRANT_COLOR.weakening }}>
                Weakening
              </strong>: still strong but momentum fading. Trim.
            </p>
            <p>
              <strong style={{ color: QUADRANT_COLOR.lagging }}>Lagging</strong>:
              weak and getting weaker. Avoid or short.
            </p>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ RRG is a relative tool. A &quot;lagging&quot; sector in a bull market can
        still be up absolute. Not financial advice.
      </div>
    </div>
  );
}
