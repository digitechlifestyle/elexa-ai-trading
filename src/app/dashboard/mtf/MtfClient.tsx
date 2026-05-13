"use client";

import { useState } from "react";
import TradingViewChart from "@/components/TradingViewChart";

const TFS: { id: "15" | "60" | "240" | "D" | "W"; label: string }[] = [
  { id: "15", label: "15m" },
  { id: "60", label: "1h" },
  { id: "240", label: "4h" },
  { id: "D", label: "1D" },
  { id: "W", label: "1W" },
];

const POPULAR = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "BTC", "ETH", "GLD"];

export default function MtfClient() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("");
  const [tfs, setTfs] = useState<("15" | "60" | "240" | "D" | "W")[]>([
    "60",
    "240",
    "D",
    "W",
  ]);

  function toggleTf(id: "15" | "60" | "240" | "D" | "W") {
    setTfs(tfs.includes(id) ? tfs.filter((x) => x !== id) : [...tfs, id]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">📺 Multi-Timeframe Analysis</h1>
        <p className="text-[var(--muted)] text-sm">
          Same symbol stacked across timeframes. Confirm trend alignment top-down
          before entering.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            setSymbol(input.toUpperCase().trim());
            setInput("");
          }
        }}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex flex-wrap gap-2 items-center"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder={`Current: ${symbol}`}
          className="flex-1 min-w-[150px] bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          Load
        </button>
        <div className="flex gap-1 flex-wrap w-full md:w-auto">
          {POPULAR.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSymbol(s)}
              className={`text-xs px-2 py-1 rounded ${
                symbol === s
                  ? "bg-indigo-600 text-white"
                  : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--muted)] mr-2">Timeframes:</span>
        {TFS.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleTf(t.id)}
            className={`text-xs px-3 py-1.5 rounded ${
              tfs.includes(t.id)
                ? "bg-indigo-600 text-white"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tfs.map((tf) => {
          const label = TFS.find((t) => t.id === tf)?.label ?? tf;
          return (
            <div
              key={tf}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden"
            >
              <p className="text-sm font-semibold p-3 border-b border-[var(--card-border)]">
                {symbol} · {label}
              </p>
              <TradingViewChart symbol={symbol} interval={tf} height={300} />
            </div>
          );
        })}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm space-y-2">
        <h2 className="font-semibold mb-2">Top-down playbook</h2>
        <p><strong>1W</strong>: macro structure. Bull or bear regime.</p>
        <p><strong>1D</strong>: trend within regime. Pullbacks, breakouts.</p>
        <p><strong>4h</strong>: setup confirmation. Entry zones.</p>
        <p><strong>1h / 15m</strong>: precision entry trigger.</p>
        <p className="text-xs text-[var(--muted)] pt-2">
          Trade in the direction of the higher timeframe trend whenever
          possible. Counter-trend works in tight setups only.
        </p>
      </div>
    </div>
  );
}
