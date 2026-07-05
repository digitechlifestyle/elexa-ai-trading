"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const allowedFocus = new Set(["crypto", "stocks", "etfs", "mixed"]);

function parseSymbols(value: string | null): string[] {
  return (value ?? "")
    .split(/[,\s]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.:-]{1,12}$/.test(symbol))
    .slice(0, 30);
}

function buildRiskNotes(focus: string, symbols: string[]) {
  const stablecoins = symbols.filter((symbol) =>
    ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol)
  );

  const notes = [
    "This is a demo simulation only. It is not financial advice and does not place trades.",
    "Use the result to organise research, not to decide whether to buy or sell.",
  ];

  if (focus === "crypto" || focus === "mixed") {
    notes.push("Crypto assets can be highly volatile and may lose most or all of their value.");
  }

  if (focus === "stocks" || focus === "mixed") {
    notes.push("Stocks can fall sharply around earnings, macro news, liquidity changes and sector rotation.");
  }

  if (focus === "etfs" || focus === "mixed") {
    notes.push("ETFs can still carry market, sector, commodity, bond or liquidity risk.");
  }

  if (stablecoins.length > 0) {
    notes.push(
      `Stablecoin watchlist item(s) detected: ${stablecoins.join(", ")}. Stablecoins can still carry issuer, reserve, liquidity, regulatory and de-peg risk.`
    );
  }

  return notes;
}

function buildDemoSummary(focus: string, primarySymbol: string, symbols: string[]) {
  const joined = symbols.join(", ");

  if (focus === "crypto") {
    return `${primarySymbol} is being reviewed inside a crypto-focused watchlist. Elexa should look at market structure, liquidity, token-specific catalysts, stablecoin exposure and overall risk sentiment before the idea is taken further.`;
  }

  if (focus === "stocks") {
    return `${primarySymbol} is being reviewed inside an equity-focused watchlist. Elexa should compare valuation, earnings sensitivity, sector momentum, macro pressure and concentration risk before the idea is taken further.`;
  }

  if (focus === "etfs") {
    return `${primarySymbol} is being reviewed inside an ETF-focused watchlist. Elexa should compare exposure, fees, liquidity, sector concentration and macro sensitivity before the idea is taken further.`;
  }

  return `${primarySymbol} is being reviewed inside a mixed-market watchlist covering ${joined}. Elexa should separate crypto risk, stock risk and ETF risk instead of treating every asset type the same.`;
}

function buildFullReview(focus: string, primarySymbol: string, symbols: string[]) {
  const hasStablecoin = symbols.some((symbol) => ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol));
  const hasEquityOrEtf = symbols.some((symbol) => ["NVDA", "MSFT", "AAPL", "SPY", "QQQ", "GLD", "SLV", "MSTR", "PLTR"].includes(symbol));
  const mixedWarning = hasEquityOrEtf && (focus === "crypto" || focus === "mixed");

  return {
    verdict:
      "This is a watchlist review, not a trade recommendation. The idea is suitable for further research only after the user checks market context, downside risk, liquidity and whether the thesis is supported by real evidence rather than hype.",
    primary:
      `${primarySymbol} is the lead item in this demo. Elexa should treat it as the starting point for research, then compare it with the rest of the watchlist instead of viewing it in isolation.`,
    watchlist:
      mixedWarning
        ? "The watchlist mixes crypto assets with stocks or ETFs. That is useful for macro comparison, but the risks are different. Crypto volatility, equity valuation and ETF exposure should be reviewed separately."
        : "The watchlist is narrow enough for a focused review, but the user should still check whether the symbols are connected by a clear thesis or just grouped together randomly.",
    stablecoin:
      hasStablecoin
        ? "Stablecoin exposure is present. Elexa should flag issuer, reserve, liquidity, regulation and de-peg risk. Stablecoins should not be presented as risk-free cash."
        : "No stablecoin was detected in this watchlist. Elexa should still check liquidity, volatility and market structure before forming a view.",
    next:
      "The next step is to collect real market data, recent news, macro context and user journal notes before any real-world decision is made outside Elexa.",
  };
}

function riskLevel(focus: string, symbols: string[]) {
  const hasCrypto = focus === "crypto" || focus === "mixed" || symbols.some((symbol) => ["BTC", "ETH", "XRP", "RLUSD", "SHX", "USDT", "USDC"].includes(symbol));
  const hasStablecoin = symbols.some((symbol) => ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol));
  const hasMixedAssets = focus === "mixed" || (hasCrypto && symbols.some((symbol) => ["NVDA", "MSFT", "AAPL", "SPY", "QQQ", "GLD"].includes(symbol)));

  if (hasMixedAssets || (hasCrypto && hasStablecoin)) {
    return "High research caution";
  }

  if (hasCrypto) {
    return "High volatility caution";
  }

  return "Moderate research caution";
}

export default function DemoResultClient() {
  const searchParams = useSearchParams();
  const focusInput = searchParams.get("focus") ?? "mixed";
  const focus = allowedFocus.has(focusInput) ? focusInput : "mixed";
  const symbols = parseSymbols(searchParams.get("symbols"));
  const primarySymbol = symbols[0] ?? "No symbol selected";
  const riskNotes = buildRiskNotes(focus, symbols);
  const summary = buildDemoSummary(focus, primarySymbol, symbols);
  const review = buildFullReview(focus, primarySymbol, symbols);
  const caution = riskLevel(focus, symbols);

  if (symbols.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-100 mb-4">
            Add at least one valid symbol
          </h1>
          <p className="text-amber-300 mb-6">
            The demo needs one or more symbols before it can generate a research result.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Demo
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-12">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Demo simulation result
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Full Elexa review for {primarySymbol}
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Demo review complete for {symbols.length} watchlist symbol
          {symbols.length === 1 ? "" : "s"}. This is a research and risk review
          output only — not a trading signal or financial advice.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Focus</p>
          <p className="text-2xl font-bold capitalize">{focus}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Primary symbol</p>
          <p className="text-2xl font-bold">{primarySymbol}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Symbols reviewed</p>
          <p className="text-2xl font-bold">{symbols.length}</p>
        </div>
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-6">
          <p className="text-amber-300 text-sm mb-2">Risk mode</p>
          <p className="text-xl font-bold text-amber-100">{caution}</p>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-4">Elexa review</h2>
        <div className="space-y-5 text-[var(--muted)] text-sm leading-relaxed">
          <p><strong className="text-white">Verdict:</strong> {review.verdict}</p>
          <p><strong className="text-white">Primary symbol view:</strong> {review.primary}</p>
          <p><strong className="text-white">Watchlist quality:</strong> {review.watchlist}</p>
          <p><strong className="text-white">Stablecoin and liquidity check:</strong> {review.stablecoin}</p>
          <p><strong className="text-white">Next research step:</strong> {review.next}</p>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Elexa summary</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed">{summary}</p>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
        <div className="flex flex-wrap gap-2">
          {symbols.map((symbol) => (
            <span
              key={symbol}
              className="text-sm bg-indigo-950 border border-indigo-800 rounded-full px-4 py-2 text-indigo-200"
            >
              {symbol}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Bull case to investigate</h2>
          <div className="space-y-3 text-indigo-200 text-sm leading-relaxed">
            <p>• Check whether recent news or macro conditions support the idea.</p>
            <p>• Look for liquidity, adoption, earnings, flows or sector strength.</p>
            <p>• Compare {primarySymbol} against the rest of the watchlist.</p>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Bear case to investigate</h2>
          <div className="space-y-3 text-[var(--muted)] text-sm leading-relaxed">
            <p>• Look for weak volume, bad news, regulatory pressure or valuation risk.</p>
            <p>• Check whether the idea depends too much on hype or one catalyst.</p>
            <p>• Ask what would make the research thesis wrong.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Research plan</h2>
          <div className="space-y-3 text-indigo-200 text-sm leading-relaxed">
            <p>• Review market context and recent catalysts.</p>
            <p>• Check volatility, liquidity and concentration risk.</p>
            <p>• Compare the idea against the rest of the watchlist.</p>
            <p>• Record the reason for the idea in a journal before taking any real-world action elsewhere.</p>
          </div>
        </div>

        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Risk notes</h2>
          <div className="space-y-3 text-amber-300 text-sm leading-relaxed">
            {riskNotes.map((note) => (
              <p key={note}>• {note}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Journal prompt</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
          Before making any decision outside Elexa, write a short note answering:
        </p>
        <div className="space-y-2 text-[var(--muted)] text-sm">
          <p>1. Why am I interested in {primarySymbol}?</p>
          <p>2. What evidence supports the idea?</p>
          <p>3. What evidence would prove me wrong?</p>
          <p>4. What risk am I not thinking about?</p>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Next action</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed">
          Continue research in demo mode. Do not connect real funds or use
          withdrawal-enabled API keys. Use this result to organise your research,
          compare risks and write a journal note before making any real-world
          decision outside Elexa.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/demo"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Run Another Demo
        </Link>
        <Link
          href="/reports/buffett-indicator"
          className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          View Buffett Indicator
        </Link>
        <Link
          href="/tool-stack"
          className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          View Tool Stack
        </Link>
      </div>
    </div>
  );
}
