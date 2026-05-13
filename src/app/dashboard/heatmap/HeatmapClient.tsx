"use client";

import { useEffect, useState } from "react";

interface Cell {
  symbol: string;
  sector: string;
  weight: number;
  change_pct: number | null;
  price: number | null;
}

interface SectorGroup {
  sector: string;
  avg_change_pct: number;
  cells: Cell[];
}

function bgFor(change: number | null): string {
  if (change == null) return "bg-[var(--background)]";
  if (change > 3) return "bg-green-600";
  if (change > 1.5) return "bg-green-700";
  if (change > 0.5) return "bg-green-800";
  if (change > 0) return "bg-green-900/60";
  if (change > -0.5) return "bg-red-900/60";
  if (change > -1.5) return "bg-red-800";
  if (change > -3) return "bg-red-700";
  return "bg-red-600";
}

function sizeFor(w: number): string {
  if (w > 75) return "col-span-3 row-span-3";
  if (w > 50) return "col-span-2 row-span-2";
  if (w > 30) return "col-span-2";
  if (w > 18) return "col-span-1 row-span-1";
  return "col-span-1";
}

export default function HeatmapClient() {
  const [sectors, setSectors] = useState<SectorGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/heatmap");
      const j = await res.json();
      if (res.ok) setSectors(j.sectors ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🗺 Market Heatmap</h1>
        <p className="text-[var(--muted)] text-sm">
          S&amp;P 100 by sector. Tile size = approximate market cap. Color =
          1-day change. Finviz-style map for instant market read.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Loading heatmap…
        </div>
      ) : (
        <div className="space-y-4">
          {sectors.map((s) => (
            <div
              key={s.sector}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">{s.sector}</h2>
                <span
                  className={`text-sm font-bold ${
                    s.avg_change_pct >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {s.avg_change_pct >= 0 ? "+" : ""}
                  {s.avg_change_pct.toFixed(2)}%
                </span>
              </div>
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 auto-rows-[60px]">
                {s.cells.map((c) => (
                  <a
                    key={c.symbol}
                    href={`/dashboard/charts?symbol=${c.symbol}`}
                    className={`${bgFor(c.change_pct)} ${sizeFor(
                      c.weight
                    )} rounded p-1 flex flex-col items-center justify-center text-center hover:ring-2 hover:ring-indigo-500 transition`}
                    title={`${c.symbol} ${c.change_pct != null ? c.change_pct.toFixed(2) + "%" : ""}`}
                  >
                    <span className="font-bold text-xs text-white">
                      {c.symbol}
                    </span>
                    {c.change_pct != null && (
                      <span className="text-[10px] text-white/90">
                        {c.change_pct >= 0 ? "+" : ""}
                        {c.change_pct.toFixed(1)}%
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 text-xs text-[var(--muted)] items-center">
        <span>-3%</span>
        <div className="flex h-3 flex-1 max-w-xs">
          <span className="flex-1 bg-red-600" />
          <span className="flex-1 bg-red-700" />
          <span className="flex-1 bg-red-800" />
          <span className="flex-1 bg-red-900/60" />
          <span className="flex-1 bg-green-900/60" />
          <span className="flex-1 bg-green-800" />
          <span className="flex-1 bg-green-700" />
          <span className="flex-1 bg-green-600" />
        </div>
        <span>+3%</span>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Universe is S&amp;P 100 only. Weights are approximate. Refreshes every
        60s. Source: Alpaca. Not financial advice.
      </div>
    </div>
  );
}
