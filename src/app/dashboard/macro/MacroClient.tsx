"use client";

import { useEffect, useState } from "react";

interface Quote {
  symbol: string;
  label: string;
  group: string;
  price: number | null;
  change_pct: number | null;
}

// Proxies traders watch
const MACRO_SYMBOLS = [
  // Vol & flight-to-safety
  { symbol: "VIXY", label: "VIX (vol)", group: "Volatility" },
  { symbol: "GLD", label: "Gold", group: "Safe haven" },
  { symbol: "SLV", label: "Silver", group: "Safe haven" },
  { symbol: "TLT", label: "20Y Treasuries", group: "Rates" },
  { symbol: "IEF", label: "7-10Y Treasuries", group: "Rates" },
  { symbol: "SHY", label: "1-3Y Treasuries", group: "Rates" },
  // FX proxies
  { symbol: "UUP", label: "USD index (DXY)", group: "FX" },
  // Commodities
  { symbol: "USO", label: "Crude oil", group: "Commodities" },
  { symbol: "UNG", label: "Natural gas", group: "Commodities" },
  { symbol: "DBA", label: "Agriculture", group: "Commodities" },
  // Crypto
  { symbol: "BTC", label: "Bitcoin", group: "Crypto" },
  { symbol: "ETH", label: "Ether", group: "Crypto" },
  // Sectors (SPDR)
  { symbol: "XLF", label: "Financials", group: "Sectors" },
  { symbol: "XLK", label: "Technology", group: "Sectors" },
  { symbol: "XLE", label: "Energy", group: "Sectors" },
  { symbol: "XLV", label: "Health Care", group: "Sectors" },
  { symbol: "XLY", label: "Consumer Disc.", group: "Sectors" },
  { symbol: "XLP", label: "Consumer Staples", group: "Sectors" },
  { symbol: "XLI", label: "Industrials", group: "Sectors" },
  { symbol: "XLU", label: "Utilities", group: "Sectors" },
  { symbol: "XLB", label: "Materials", group: "Sectors" },
  { symbol: "XLRE", label: "Real Estate", group: "Sectors" },
];

export default function MacroClient() {
  const [quotes, setQuotes] = useState<Quote[]>(
    MACRO_SYMBOLS.map((s) => ({ ...s, price: null, change_pct: null }))
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const symbols = MACRO_SYMBOLS.map((s) => s.symbol);
    try {
      // 1) Latest prices
      const priceRes = await fetch("/api/trading/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange: "alpaca", symbols }),
      }).then((r) => r.json());
      const prices: Record<string, number | null> = priceRes?.prices ?? {};

      // 2) 24h change via bars endpoint (2 most recent bars per symbol)
      const changes: Record<string, number | null> = {};
      await Promise.all(
        symbols.map(async (sym) => {
          try {
            const bars = await fetch(
              `/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=5`
            ).then((r) => r.json());
            const arr = (bars?.bars ?? []) as { c: number }[];
            if (arr.length >= 2) {
              const prev = arr[arr.length - 2].c;
              const cur = prices[sym] ?? arr[arr.length - 1].c;
              changes[sym] = ((cur - prev) / prev) * 100;
            } else {
              changes[sym] = null;
            }
          } catch {
            changes[sym] = null;
          }
        })
      );

      setQuotes(
        MACRO_SYMBOLS.map((s) => ({
          ...s,
          price: prices[s.symbol] ?? null,
          change_pct: changes[s.symbol] ?? null,
        }))
      );
      setUpdatedAt(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 60000);
    return () => clearInterval(t);
  }, []);

  // Group by section
  const groups = Array.from(new Set(MACRO_SYMBOLS.map((s) => s.group)));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🏛 Macro Dashboard</h1>
          <p className="text-[var(--muted)] text-sm">
            Wall Street&apos;s daily-watch list: volatility, rates, FX, commodities,
            crypto, and sector heatmap. Updates every 60s.
          </p>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {loading ? "Refreshing…" : updatedAt ? `Updated ${updatedAt}` : ""}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g}>
          <h2 className="font-semibold mb-3">{g}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {quotes
              .filter((q) => q.group === g)
              .map((q) => {
                const change = q.change_pct;
                const tone =
                  change == null
                    ? ""
                    : change >= 0
                    ? "border-green-700"
                    : "border-red-700";
                return (
                  <a
                    key={q.symbol}
                    href={`/dashboard/charts?symbol=${q.symbol}`}
                    className={`block bg-[var(--card)] border ${tone || "border-[var(--card-border)]"} rounded-xl p-3 hover:border-indigo-600 transition-colors`}
                  >
                    <p className="text-xs text-[var(--muted)] truncate">{q.label}</p>
                    <p className="font-bold text-lg mt-1">{q.symbol}</p>
                    <p className="text-sm mt-1">
                      {q.price != null
                        ? `$${q.price.toFixed(q.price < 1 ? 6 : 2)}`
                        : "…"}
                    </p>
                    {change != null ? (
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          change >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted)] mt-1">—</p>
                    )}
                  </a>
                );
              })}
          </div>
        </section>
      ))}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Macro signals are context, not buy/sell triggers. Cross-check with
        your own thesis. Research only — not financial advice.
      </div>
    </div>
  );
}
