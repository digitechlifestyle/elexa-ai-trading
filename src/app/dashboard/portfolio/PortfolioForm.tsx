"use client";

import { useState } from "react";
import { getAvailableExchanges } from "@/lib/exchanges/factory";

const EXCHANGES = getAvailableExchanges();

export default function PortfolioPage() {
  const [exchange, setExchange] = useState<string>("alpaca");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedExchange = EXCHANGES.find((e) => e.id === exchange);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/trading/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          symbol,
          qty: Number(qty),
          side,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`Error: ${data.error}`);
      } else {
        setStatus(
          `✓ Paper ${side} order submitted for ${qty} × ${symbol.toUpperCase()} on ${selectedExchange?.name}`
        );
        setSymbol("");
        setQty("");
      }
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Portfolio</h1>
        <p className="text-[var(--muted)] text-sm">
          Place simulated paper trades across multiple exchanges and assets.
        </p>
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl px-5 py-3 text-amber-300 text-sm">
        <strong>Paper Trading Only.</strong> All orders are executed in simulated environments. No real capital is at risk.
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Exchange selector */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Select Exchange</h2>
          <div className="space-y-2">
            {EXCHANGES.map((ex) => (
              <label key={ex.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[var(--background)] transition-colors">
                <input
                  type="radio"
                  name="exchange"
                  value={ex.id}
                  checked={exchange === ex.id}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-[var(--muted)]">{ex.assets.join(", ")}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Trade form */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-5">Place Paper Order</h2>
          <form onSubmit={submitOrder} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5">
                Symbol — stocks, ETFs, commodities, crypto
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
                placeholder="AAPL, GLD, USO, BTC, ETH, SOL, DOGE..."
                maxLength={12}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              />
              <p className="text-xs text-[var(--muted)] mt-1.5">
                Stocks: AAPL, MSFT, TSLA, NVDA · Gold: GLD · Silver: SLV · Oil:
                USO · Crypto: BTC, ETH, XRP, SOL, DOGE, SHIB, PEPE
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1.5">Quantity</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                min={0.000001}
                step="any"
                placeholder="10 (stocks) or 0.01 (crypto)"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              />
              <p className="text-xs text-[var(--muted)] mt-1.5">
                Stocks: whole or fractional shares. Crypto: any amount, e.g.
                0.001 BTC.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  side === "buy"
                    ? "bg-green-700 border-green-600 text-white"
                    : "border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  side === "sell"
                    ? "bg-red-800 border-red-700 text-white"
                    : "border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                Sell
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? "Submitting…" : "Submit Paper Order"}
            </button>
          </form>

          {status && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                status.startsWith("Error")
                  ? "bg-red-950 border border-red-800 text-red-300"
                  : "bg-green-950 border border-green-800 text-green-300"
              }`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
