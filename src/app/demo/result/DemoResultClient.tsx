"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const allowedFocus = new Set(["crypto", "stocks", "etfs", "mixed"]);

const assetProfiles: Record<string, { type: string; review: string; risk: string; research: string }> = {
  BTC: {
    type: "Bitcoin / digital scarcity asset",
    review:
      "BTC is the main crypto market benchmark. For this watchlist, it should be reviewed as the lead risk-sentiment asset, not as a guaranteed buy. Elexa should check whether the wider crypto market is strengthening or weakening before taking the idea further.",
    risk: "High volatility, macro sensitivity, drawdown risk and liquidity-driven price swings.",
    research: "Check ETF flows, dollar strength, rates, liquidity, on-chain activity and recent market structure.",
  },
  ETH: {
    type: "Smart contract platform asset",
    review:
      "ETH needs a different review from BTC. It should be judged on network usage, staking, developer activity, L2 adoption and DeFi demand. Elexa should not treat it as simply another Bitcoin-style asset.",
    risk: "High volatility, regulatory uncertainty, competition and ecosystem concentration.",
    research: "Check staking yields, network fees, L2 usage, DeFi activity and competing smart-contract chains.",
  },
  XRP: {
    type: "Payments / settlement asset",
    review:
      "XRP should be reviewed as a payments and settlement narrative asset. The core question is whether real-world payment use, liquidity corridors and institutional adoption support the thesis beyond headlines.",
    risk: "Regulatory history, headline volatility, liquidity assumptions and adoption uncertainty.",
    research: "Check Ripple ecosystem news, payment corridor usage, legal/regulatory updates and exchange liquidity.",
  },
  XLM: {
    type: "Payments / financial inclusion asset",
    review:
      "XLM should be reviewed through low-cost payments, remittances, tokenisation and financial inclusion. It may fit a utility watchlist, but Elexa should look for real adoption evidence before giving it weight.",
    risk: "Adoption risk, liquidity risk, competition and limited retail attention.",
    research: "Check Stellar ecosystem activity, partnerships, tokenisation use cases and payment-volume evidence.",
  },
  RLUSD: {
    type: "Stablecoin / settlement liquidity",
    review:
      "RLUSD should not be reviewed as a profit asset. Its role is settlement, liquidity and payment infrastructure. Elexa should make clear that stablecoins can still carry serious issuer and reserve risks.",
    risk: "Issuer risk, reserve risk, redemption risk, regulation, liquidity and de-peg risk.",
    research: "Check issuer disclosures, reserve transparency, regulatory status, exchange support and redemption mechanics.",
  },
  SHX: {
    type: "Utility / settlement infrastructure token",
    review:
      "SHX is a smaller utility-token idea. It may be interesting, but it needs stricter checks because smaller assets can move sharply and may have weaker liquidity. Elexa should check real utility before treating it as a serious thesis.",
    risk: "Smaller-cap liquidity risk, volatility, adoption uncertainty and concentration risk.",
    research: "Check Stronghold ecosystem updates, token utility, exchange liquidity, supply dynamics and real customer usage.",
  },
  NVDA: {
    type: "AI infrastructure stock",
    review:
      "NVDA is not a crypto asset. It belongs in this watchlist only as an AI and market-risk comparison. Elexa should review earnings, valuation and AI infrastructure demand separately from crypto narratives.",
    risk: "Valuation risk, earnings surprise risk, supply-chain risk, competition and AI-capex slowdown risk.",
    research: "Check earnings, guidance, data-centre demand, margins, customer concentration and AI sector sentiment.",
  },
  SPY: {
    type: "Broad US equity ETF",
    review:
      "SPY gives broad US market context. It helps Elexa compare whether the watchlist is moving with general risk appetite or from asset-specific news.",
    risk: "Market-wide drawdown risk, valuation risk, mega-cap concentration and macro sensitivity.",
    research: "Check S&P 500 valuation, earnings breadth, rates, inflation, liquidity and Buffett Indicator context.",
  },
};

function parseSymbols(value: string | null): string[] {
  return (value ?? "")
    .split(/[,\s]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.:-]{1,12}$/.test(symbol))
    .slice(0, 30);
}

function getAssetProfile(symbol: string) {
  return (
    assetProfiles[symbol] ?? {
      type: "Custom watchlist symbol",
      review:
        `${symbol} is a custom symbol in this demo. Elexa should validate what it represents before it is treated as a serious research item.`,
      risk: "Unknown risk profile until market, liquidity, issuer/project and data quality are checked.",
      research: "Check what the symbol represents, where it trades, recent news, liquidity, volatility and credible data sources.",
    }
  );
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

function riskLevel(focus: string, symbols: string[]) {
  const hasCrypto = focus === "crypto" || focus === "mixed" || symbols.some((symbol) => ["BTC", "ETH", "XRP", "RLUSD", "SHX", "XLM", "USDT", "USDC"].includes(symbol));
  const hasStablecoin = symbols.some((symbol) => ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol));
  const hasMixedAssets = focus === "mixed" || (hasCrypto && symbols.some((symbol) => ["NVDA", "MSFT", "AAPL", "SPY", "QQQ", "GLD"].includes(symbol)));

  if (hasMixedAssets || (hasCrypto && hasStablecoin)) return "High research caution";
  if (hasCrypto) return "High volatility caution";
  return "Moderate research caution";
}

export default function DemoResultClient() {
  const searchParams = useSearchParams();
  const focusInput = searchParams.get("focus") ?? "mixed";
  const focus = allowedFocus.has(focusInput) ? focusInput : "mixed";
  const symbols = parseSymbols(searchParams.get("symbols"));
  const primarySymbol = symbols[0] ?? "No symbol selected";
  const riskNotes = buildRiskNotes(focus, symbols);
  const caution = riskLevel(focus, symbols);

  if (symbols.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-100 mb-4">Add at least one valid symbol</h1>
          <p className="text-amber-300 mb-6">The demo needs one or more symbols before it can generate a research result.</p>
          <Link href="/demo" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors">Back to Demo</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-12">
        <p className="text-indigo-400 text-sm font-semibold mb-3">Demo simulation result</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">Full Elexa review for {primarySymbol}</h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Demo review complete for {symbols.length} watchlist symbol{symbols.length === 1 ? "" : "s"}. This is a research and risk review output only — not a trading signal or financial advice.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"><p className="text-[var(--muted)] text-sm mb-2">Focus</p><p className="text-2xl font-bold capitalize">{focus}</p></div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"><p className="text-[var(--muted)] text-sm mb-2">Primary symbol</p><p className="text-2xl font-bold">{primarySymbol}</p></div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"><p className="text-[var(--muted)] text-sm mb-2">Symbols reviewed</p><p className="text-2xl font-bold">{symbols.length}</p></div>
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-6"><p className="text-amber-300 text-sm mb-2">Risk mode</p><p className="text-xl font-bold text-amber-100">{caution}</p></div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-4">Elexa review verdict</h2>
        <div className="space-y-5 text-[var(--muted)] text-sm leading-relaxed">
          <p><strong className="text-white">Verdict:</strong> Further research only. This watchlist is not clean enough to become a trade idea without separating crypto, stablecoin, stock and ETF risks.</p>
          <p><strong className="text-white">Primary symbol view:</strong> {primarySymbol} is the lead item, but Elexa must compare it against every other symbol before forming a view.</p>
          <p><strong className="text-white">Watchlist quality:</strong> This is a mixed risk watchlist. It is useful for comparison, but it is not a single trading thesis.</p>
          <p><strong className="text-white">Next research step:</strong> Collect real market data, recent news, macro context and user journal notes before any real-world decision outside Elexa.</p>
        </div>
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8 mb-10">
        <h2 className="text-3xl font-bold mb-4">Symbol-by-symbol review</h2>
        <p className="text-indigo-200 text-sm leading-relaxed mb-6">Each watchlist item is reviewed separately so Elexa shows different risk checks for different asset types.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {symbols.map((symbol) => {
            const profile = getAssetProfile(symbol);
            return (
              <div key={symbol} className="bg-[var(--background)] border border-indigo-800 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-2xl font-bold">{symbol}</h3>
                  <span className="text-xs bg-indigo-900 border border-indigo-700 rounded-full px-3 py-1 text-indigo-200">{profile.type}</span>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed mb-4"><strong>Review:</strong> {profile.review}</p>
                <p className="text-amber-300 text-sm leading-relaxed mb-4"><strong>Main risk:</strong> {profile.risk}</p>
                <p className="text-[var(--muted)] text-sm leading-relaxed"><strong className="text-white">Research check:</strong> {profile.research}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8"><h2 className="text-2xl font-bold mb-4">Bull case to investigate</h2><div className="space-y-3 text-indigo-200 text-sm leading-relaxed"><p>• Check whether recent news or macro conditions support the idea.</p><p>• Look for liquidity, adoption, earnings, flows or sector strength.</p><p>• Compare {primarySymbol} against the rest of the watchlist.</p></div></div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8"><h2 className="text-2xl font-bold mb-4">Bear case to investigate</h2><div className="space-y-3 text-[var(--muted)] text-sm leading-relaxed"><p>• Look for weak volume, bad news, regulatory pressure or valuation risk.</p><p>• Check whether the idea depends too much on hype or one catalyst.</p><p>• Ask what would make the research thesis wrong.</p></div></div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8"><h2 className="text-2xl font-bold mb-4">Research plan</h2><div className="space-y-3 text-indigo-200 text-sm leading-relaxed"><p>• Review market context and recent catalysts.</p><p>• Check volatility, liquidity and concentration risk.</p><p>• Compare the idea against the rest of the watchlist.</p><p>• Record the reason for the idea in a journal before taking any real-world action elsewhere.</p></div></div>
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-8"><h2 className="text-2xl font-bold text-amber-100 mb-4">Risk notes</h2><div className="space-y-3 text-amber-300 text-sm leading-relaxed">{riskNotes.map((note) => (<p key={note}>• {note}</p>))}</div></div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10"><h2 className="text-2xl font-bold mb-4">Journal prompt</h2><p className="text-[var(--muted)] text-sm leading-relaxed mb-4">Before making any decision outside Elexa, write a short note answering:</p><div className="space-y-2 text-[var(--muted)] text-sm"><p>1. Why am I interested in {primarySymbol}?</p><p>2. What evidence supports the idea?</p><p>3. What evidence would prove me wrong?</p><p>4. What risk am I not thinking about?</p></div></section>
      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10"><h2 className="text-2xl font-bold mb-4">Next action</h2><p className="text-[var(--muted)] text-sm leading-relaxed">Continue research in demo mode. Do not connect real funds or use withdrawal-enabled API keys. Use this result to organise your research, compare risks and write a journal note before making any real-world decision outside Elexa.</p></section>
      <div className="flex flex-wrap gap-4 justify-center"><Link href="/demo" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors">Run Another Demo</Link><Link href="/reports/buffett-indicator" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">View Buffett Indicator</Link><Link href="/tool-stack" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">View Tool Stack</Link></div>
    </div>
  );
}
