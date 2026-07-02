"use client";

import { useMemo, useState } from "react";

type Focus = "crypto" | "stocks" | "etfs" | "mixed";

const watchlistPresets: Record<Focus, string[]> = {
  crypto: ["BTC", "ETH", "XRP", "XLM", "HBAR", "XDC", "QNT", "ADA", "SOL", "RLUSD", "USDC"],
  stocks: ["NVDA", "MSFT", "AAPL", "GOOGL", "META", "AMZN", "AMD", "PLTR", "TSM", "AVGO"],
  etfs: ["SPY", "VOO", "QQQ", "VTI", "DIA", "IWM", "GLD", "SLV", "TLT", "BND"],
  mixed: ["BTC", "ETH", "XRP", "RLUSD", "NVDA", "MSFT", "AAPL", "SPY", "QQQ", "GLD", "SLV"],
};

const focusLabels: Record<Focus, string> = {
  crypto: "Crypto and stablecoins",
  stocks: "Stocks",
  etfs: "ETFs",
  mixed: "Mixed markets",
};

const demoNotes: Record<Focus, string[]> = {
  crypto: [
    "Watch for volatility, liquidity, exchange availability and stablecoin de-peg risk.",
    "Use RLUSD, USDC and USDT as research examples only, not as risk-free assets.",
    "Utility tokens should be researched by use case, adoption, tokenomics and regulatory risk.",
  ],
  stocks: [
    "Compare earnings, valuation, sector strength, volatility and concentration risk.",
    "AI and technology stocks can move sharply around earnings and guidance.",
    "Do not treat a strong brand or news headline as a complete investment case.",
  ],
  etfs: [
    "ETFs can help compare broad markets, sectors, commodities and bond exposure.",
    "Commodity-linked ETFs are not the same as direct physical ownership.",
    "Bond ETFs can still fall when rates, credit spreads or liquidity conditions change.",
  ],
  mixed: [
    "Mixed watchlists help compare crypto, stocks and ETFs in one research workflow.",
    "Keep risk separate by asset type because volatility is not the same across markets.",
    "Use simulation first before making any real-world decision outside Elexa.",
  ],
};

export default function DemoClient() {
  const [focus, setFocus] = useState<Focus>("mixed");
  const [selected, setSelected] = useState<string[]>(watchlistPresets.mixed);
  const [customSymbol, setCustomSymbol] = useState("");
  const [riskChecked, setRiskChecked] = useState(false);
  const [simulationRun, setSimulationRun] = useState(false);

  const researchNotes = useMemo(() => demoNotes[focus], [focus]);

  function changeFocus(nextFocus: Focus) {
    setFocus(nextFocus);
    setSelected(watchlistPresets[nextFocus]);
    setRiskChecked(false);
    setSimulationRun(false);
  }

  function toggleAsset(asset: string) {
    setSelected((current) =>
      current.includes(asset)
        ? current.filter((item) => item !== asset)
        : [...current, asset]
    );
    setSimulationRun(false);
  }

  function addCustomSymbol() {
    const clean = customSymbol.trim().toUpperCase();
    if (!clean || selected.includes(clean)) return;
    setSelected((current) => [...current, clean]);
    setCustomSymbol("");
    setSimulationRun(false);
  }

  const sampleIdea = selected[0] ?? "BTC";

  return (
    <div className="space-y-12">
      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
        <p className="text-indigo-400 text-sm font-semibold mb-3">Step 1</p>
        <h2 className="text-2xl font-bold mb-4">Choose market focus</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(watchlistPresets) as Focus[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeFocus(item)}
              className={`px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                focus === item
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:text-white hover:border-indigo-600"
              }`}
            >
              {focusLabels[item]}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
        <p className="text-indigo-400 text-sm font-semibold mb-3">Step 2</p>
        <h2 className="text-2xl font-bold mb-4">Build demo watchlist</h2>
        <p className="text-[var(--muted)] text-sm mb-5">
          Click symbols to add or remove them. This is a local browser demo only.
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {watchlistPresets[focus].map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => toggleAsset(asset)}
              className={`text-xs rounded-full px-3 py-2 border transition-colors ${
                selected.includes(asset)
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:text-white hover:border-indigo-600"
              }`}
            >
              {asset}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={customSymbol}
            onChange={(event) => setCustomSymbol(event.target.value)}
            placeholder="Add symbol, e.g. RLUSD, SHX, MSTR"
            className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm text-white outline-none focus:border-indigo-600"
          />
          <button
            type="button"
            onClick={addCustomSymbol}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Symbol
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-indigo-400 text-sm font-semibold mb-3">Step 3</p>
          <h2 className="text-2xl font-bold mb-4">AI research preview</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
            Demo research focus: <strong className="text-white">{sampleIdea}</strong>
          </p>
          <div className="space-y-3">
            {researchNotes.map((note) => (
              <div key={note} className="flex gap-3 text-sm text-[var(--muted)]">
                <span className="text-indigo-400">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-indigo-400 text-sm font-semibold mb-3">Step 4</p>
          <h2 className="text-2xl font-bold mb-4">Risk check</h2>
          <label className="flex gap-3 text-sm text-[var(--muted)] mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={riskChecked}
              onChange={(event) => setRiskChecked(event.target.checked)}
              className="mt-1"
            />
            <span>
              I understand this is a demo only, not advice, not a signal and not
              a real-money trading instruction.
            </span>
          </label>
          <button
            type="button"
            disabled={!riskChecked || selected.length === 0}
            onClick={() => setSimulationRun(true)}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Run Demo Simulation
          </button>
        </div>
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Demo output</h2>
        {simulationRun ? (
          <div className="space-y-4 text-sm text-indigo-200 leading-relaxed">
            <p>
              Demo simulation complete for <strong>{selected.length}</strong> watchlist symbols.
            </p>
            <p>
              Example conclusion: continue research, compare risk across symbols,
              avoid live execution, and only use read-only or paper/sandbox
              connections when ready.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {selected.map((asset) => (
                <span key={asset} className="text-xs bg-indigo-900 border border-indigo-700 rounded-full px-3 py-1">
                  {asset}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-indigo-300 text-sm leading-relaxed">
            Select a focus, build your watchlist, confirm the risk warning and
            run the demo simulation. No data is saved and no account is required.
          </p>
        )}
      </section>
    </div>
  );
}
