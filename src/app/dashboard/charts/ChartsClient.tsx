"use client";

import { useState } from "react";
import TradingViewChart from "@/components/TradingViewChart";

const POPULAR = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "BTC", "ETH", "SOL", "XRP", "GLD"];

const INTERVALS: { id: "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W"; label: string }[] =
  [
    { id: "15", label: "15m" },
    { id: "60", label: "1h" },
    { id: "240", label: "4h" },
    { id: "D", label: "1D" },
    { id: "W", label: "1W" },
  ];

export default function ChartsClient({ initial }: { initial: string }) {
  const [symbol, setSymbol] = useState(initial);
  const [input, setInput] = useState("");
  const [interval, setInterval] = useState<typeof INTERVALS[number]["id"]>("D");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      setSymbol(input.toUpperCase().trim());
      setInput("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Charts</h1>
          <p className="text-[var(--muted)] text-sm">
            Professional charts via TradingView. Stocks and crypto. Switch
            timeframes, draw, zoom.
          </p>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 space-y-4">
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder={`Currently: ${symbol} — type to switch`}
            className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold"
          >
            Load
          </button>
        </form>

        <div className="flex justify-between items-center gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {POPULAR.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                  symbol === s
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv.id}
                onClick={() => setInterval(iv.id)}
                className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                  interval === iv.id
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <TradingViewChart symbol={symbol} interval={interval} height={600} />
      </div>

      <p className="text-xs text-[var(--muted)] text-center">
        Charts powered by TradingView. Data delayed for some symbols. Not financial advice.
      </p>
    </div>
  );
}
