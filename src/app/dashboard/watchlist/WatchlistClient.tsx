"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface SymbolData {
  symbol: string;
  price: number | null;
  bars: Bar[];
  change24h: number | null;
  loading: boolean;
}

export default function WatchlistClient({ initial }: { initial: string[] }) {
  const [list, setList] = useState<string[]>(initial);
  const [data, setData] = useState<Record<string, SymbolData>>({});
  const [adding, setAdding] = useState("");
  const [addingState, setAddingState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const loadSymbol = useCallback(async (sym: string) => {
    setData((prev) => ({
      ...prev,
      [sym]: prev[sym] ?? { symbol: sym, price: null, bars: [], change24h: null, loading: true },
    }));
    try {
      const [priceRes, barsRes] = await Promise.all([
        fetch("/api/trading/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exchange: "alpaca", symbols: [sym] }),
        }).then((r) => r.json()),
        fetch(`/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=30`).then(
          (r) => r.json()
        ),
      ]);
      const price = priceRes?.prices?.[sym] ?? null;
      const bars: Bar[] = barsRes?.bars ?? [];
      const change24h =
        bars.length >= 2
          ? ((bars[bars.length - 1].c - bars[bars.length - 2].c) /
              bars[bars.length - 2].c) *
            100
          : null;
      setData((prev) => ({
        ...prev,
        [sym]: { symbol: sym, price, bars, change24h, loading: false },
      }));
    } catch {
      setData((prev) => ({
        ...prev,
        [sym]: { symbol: sym, price: null, bars: [], change24h: null, loading: false },
      }));
    }
  }, []);

  useEffect(() => {
    list.forEach(loadSymbol);
    // refresh prices every 30s
    const t = setInterval(() => {
      list.forEach(loadSymbol);
    }, 30000);
    return () => clearInterval(t);
  }, [list, loadSymbol]);

  async function addSymbol(e: React.FormEvent) {
    e.preventDefault();
    const sym = adding.trim().toUpperCase();
    if (!sym) return;
    setAddingState("saving");
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to add");
      } else {
        setList(json.watchlist);
        setAdding("");
      }
    } catch {
      setError("Network error");
    } finally {
      setAddingState("idle");
    }
  }

  async function removeSymbol(sym: string) {
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        setList(json.watchlist);
        setData((prev) => {
          const next = { ...prev };
          delete next[sym];
          return next;
        });
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={addSymbol}
        className="flex gap-3 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4"
      >
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value.toUpperCase())}
          placeholder="Add a symbol — AAPL, BTC, GLD, DOGE..."
          maxLength={12}
          className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
        />
        <button
          type="submit"
          disabled={addingState === "saving" || !adding.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {addingState === "saving" ? "Adding…" : "Add"}
        </button>
      </form>
      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
          <p className="text-[var(--muted)]">Your watchlist is empty.</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Add a symbol above to track its price and 30-day chart.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((sym) => {
            const d = data[sym];
            const change = d?.change24h;
            return (
              <div
                key={sym}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 relative"
              >
                <button
                  onClick={() => removeSymbol(sym)}
                  className="absolute top-3 right-3 text-[var(--muted)] hover:text-red-400 text-xs"
                  title="Remove"
                >
                  ✕
                </button>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">{sym}</p>
                    <p className="text-2xl font-semibold mt-1">
                      {d?.price != null
                        ? `$${d.price.toFixed(d.price < 1 ? 6 : 2)}`
                        : "…"}
                    </p>
                  </div>
                  {change != null && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        change >= 0
                          ? "bg-green-950 text-green-400"
                          : "bg-red-950 text-red-400"
                      }`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="h-20 mt-3">
                  {d && d.bars.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={d.bars}>
                        <Tooltip
                          contentStyle={{
                            background: "#12121a",
                            border: "1px solid #1e1e2e",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Close"]}
                          labelFormatter={(l) => new Date(l).toLocaleDateString()}
                        />
                        <Line
                          type="monotone"
                          dataKey="c"
                          stroke={change != null && change >= 0 ? "#22c55e" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[var(--muted)]">
                      {d?.loading ? "Loading chart…" : "No chart data"}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">30-day daily close</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
