"use client";

import { useEffect, useState } from "react";

const SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA",
  "AAPL", "MSFT", "NVDA", "GOOGL", "TSLA", "META", "AMZN",
  "BTC", "ETH", "SOL", "XRP",
  "GLD", "SLV", "USO", "TLT",
];

interface Tick {
  symbol: string;
  price: number;
  change_pct: number | null;
}

export default function TickerTape() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [hidden, setHidden] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/trading/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange: "alpaca", symbols: SYMBOLS }),
      });
      const j = await res.json();
      if (j?.prices) {
        // Also fetch yesterday's close for each — single batched fetch is cleaner,
        // but we already have a price endpoint. For change %, do a parallel bars call per sym.
        const next: Tick[] = await Promise.all(
          SYMBOLS.map(async (s) => {
            const price = j.prices[s] ?? null;
            if (price == null) return { symbol: s, price: 0, change_pct: null };
            try {
              const barsRes = await fetch(
                `/api/trading/bars?symbol=${encodeURIComponent(s)}&days=5`
              );
              const barsJson = await barsRes.json();
              const arr = (barsJson?.bars ?? []) as { c: number }[];
              const prev = arr.length >= 2 ? arr[arr.length - 2].c : null;
              const ch = prev ? ((price - prev) / prev) * 100 : null;
              return { symbol: s, price, change_pct: ch };
            } catch {
              return { symbol: s, price, change_pct: null };
            }
          })
        );
        setTicks(next);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (hidden || ticks.length === 0) return null;

  return (
    <div className="border-b border-[var(--card-border)] bg-[var(--card)] overflow-hidden relative">
      <button
        onClick={() => setHidden(true)}
        className="absolute right-2 top-1 text-xs text-[var(--muted)] hover:text-white z-10 px-2 py-0.5 rounded bg-[var(--background)]"
        title="Hide ticker"
      >
        ✕
      </button>
      <div className="ticker-tape">
        <div className="ticker-tape-inner flex gap-6 py-2 whitespace-nowrap text-sm">
          {ticks.concat(ticks).map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-2"
            >
              <span className="font-bold">{t.symbol}</span>
              <span>
                ${t.price.toFixed(t.price < 1 ? 4 : 2)}
              </span>
              {t.change_pct != null && (
                <span
                  className={`text-xs ${
                    t.change_pct >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {t.change_pct >= 0 ? "▲" : "▼"} {Math.abs(t.change_pct).toFixed(2)}%
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-tape {
          overflow: hidden;
          width: 100%;
        }
        .ticker-tape-inner {
          animation: scroll 80s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
