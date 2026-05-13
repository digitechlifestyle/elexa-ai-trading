"use client";

import { useEffect, useState } from "react";

interface Position {
  symbol: string;
  sector: string;
  value: number;
  weight_pct: number;
}

interface Sector {
  sector: string;
  value: number;
  positions: number;
  weight_pct: number;
}

interface Data {
  empty?: boolean;
  total_value: number;
  positions_count: number;
  sectors_count: number;
  top1_pct: number;
  top3_pct: number;
  top5_pct: number;
  hhi: number;
  by_position: Position[];
  by_sector: Sector[];
}

function hhiLabel(hhi: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (hhi < 1500) return { label: "Well diversified", tone: "good" };
  if (hhi < 2500) return { label: "Moderate", tone: "warn" };
  if (hhi < 5000) return { label: "Concentrated", tone: "bad" };
  return { label: "Extreme concentration", tone: "bad" };
}

export default function ConcentrationClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/concentration")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
        Analysing concentration…
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">🎯 Concentration Risk</h1>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          No filled positions yet.
        </div>
      </div>
    );
  }

  const hhiCls = hhiLabel(data.hhi);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎯 Concentration Risk</h1>
        <p className="text-[var(--muted)] text-sm">
          How concentrated is your book? Top-N exposure, sector tilt, and HHI
          (Herfindahl-Hirschman Index).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Top 1 position"
          value={`${data.top1_pct.toFixed(1)}%`}
          tone={data.top1_pct > 30 ? "bad" : data.top1_pct > 20 ? "warn" : "good"}
        />
        <Stat
          label="Top 3 positions"
          value={`${data.top3_pct.toFixed(1)}%`}
          tone={data.top3_pct > 60 ? "bad" : data.top3_pct > 45 ? "warn" : "good"}
        />
        <Stat
          label="Top 5 positions"
          value={`${data.top5_pct.toFixed(1)}%`}
          tone={data.top5_pct > 80 ? "bad" : data.top5_pct > 65 ? "warn" : "good"}
        />
        <Stat
          label="HHI"
          value={`${data.hhi.toFixed(0)}`}
          tone={hhiCls.tone}
          hint={hhiCls.label}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">By position ({data.positions_count})</h2>
          <div className="space-y-2">
            {data.by_position.map((p) => (
              <div key={p.symbol}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-bold">{p.symbol}</span>
                  <span>
                    <span className="font-semibold">{p.weight_pct.toFixed(1)}%</span>
                    <span className="text-[var(--muted)] text-xs ml-2">
                      ${p.value.toFixed(0)}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--background)] rounded">
                  <div
                    className={`h-full rounded ${
                      p.weight_pct > 30
                        ? "bg-red-600"
                        : p.weight_pct > 20
                        ? "bg-amber-600"
                        : "bg-indigo-600"
                    }`}
                    style={{ width: `${p.weight_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">By sector ({data.sectors_count})</h2>
          <div className="space-y-2">
            {data.by_sector.map((s) => (
              <div key={s.sector}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium">{s.sector}</span>
                  <span>
                    <span className="font-semibold">{s.weight_pct.toFixed(1)}%</span>
                    <span className="text-[var(--muted)] text-xs ml-2">
                      {s.positions} pos
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--background)] rounded">
                  <div
                    className={`h-full rounded ${
                      s.weight_pct > 40
                        ? "bg-red-600"
                        : s.weight_pct > 25
                        ? "bg-amber-600"
                        : "bg-indigo-600"
                    }`}
                    style={{ width: `${s.weight_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
        <h2 className="font-semibold mb-2">Interpretation</h2>
        <p><strong>HHI &lt; 1500</strong>: Well diversified across positions.</p>
        <p><strong>HHI 1500-2500</strong>: Moderate concentration.</p>
        <p><strong>HHI 2500-5000</strong>: Concentrated. Single-name risk dominates.</p>
        <p><strong>HHI &gt; 5000</strong>: Extreme — basically a one-trick portfolio.</p>
        <p className="text-xs text-[var(--muted)] pt-2">
          Single position &gt; 20% of book = elevated single-name risk. Sector &gt; 40% = sector risk.
        </p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Concentration uses cost basis. Live value would shift weights with
        unrealised P&amp;L. Sector mapping is heuristic. Not financial advice.
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
  hint?: string;
}) {
  const c =
    tone === "good"
      ? "text-green-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-red-400"
      : "";
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${c}`}>{value}</p>
      {hint && <p className="text-[10px] text-[var(--muted)] mt-1">{hint}</p>}
    </div>
  );
}
