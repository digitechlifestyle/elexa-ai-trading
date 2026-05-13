"use client";

import { useEffect, useState } from "react";

interface TagStat {
  tag: string;
  trades: number;
  total_pnl: number;
  avg_pnl: number;
  win_rate_pct: number;
  symbols: string[];
}

export default function TagAnalyticsClient() {
  const [tags, setTags] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tag-analytics")
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🏷 Tag Analytics</h1>
        <p className="text-[var(--muted)] text-sm">
          Performance by trade tag. Find your edge — which setups make money,
          which lose. Tag your trades on the Portfolio page to populate this.
        </p>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center text-[var(--muted)]">
          Crunching numbers…
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--muted)]">
            No tagged trades yet. Visit Portfolio → tag your trades to start.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((t) => (
            <div
              key={t.tag}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5"
            >
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <p className="text-xl font-bold">#{t.tag}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t.trades} trades · {t.symbols.length} symbols
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      t.total_pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.total_pnl >= 0 ? "+" : ""}${t.total_pnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Avg ${t.avg_pnl.toFixed(2)} · Win{" "}
                    {t.win_rate_pct.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.symbols.map((s) => (
                  <span
                    key={s}
                    className="bg-[var(--background)] border border-[var(--card-border)] text-xs px-2 py-0.5 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Tag analytics shows realised P&amp;L per tag (sells − buys). Pure flow
        accounting — best for closed loops. Tag consistently to make patterns
        visible.
      </div>
    </div>
  );
}
