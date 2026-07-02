import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Markets & Exchange Connections",
  description:
    "Supported markets and planned exchange connection options for Elexa AI Trading launch mode.",
};

const markets = [
  {
    title: "Stocks",
    examples: "AAPL, MSFT, TSLA, NVDA and other listed equities",
    status: "Research and simulated strategy testing",
  },
  {
    title: "ETFs",
    examples: "Broad market ETFs and sector funds where data is available",
    status: "Research, watchlists and simulation",
  },
  {
    title: "Commodity-linked ETFs",
    examples: "GLD for gold, SLV for silver, USO for oil, UNG for natural gas",
    status: "Market exposure via ETF symbols, not physical commodity trading",
  },
  {
    title: "Crypto assets",
    examples:
      "BTC, ETH, XRP, SOL, ADA, AVAX, DOGE, SHIB, PEPE, USDT, USDC and more",
    status: "Research, watchlists and simulated crypto strategy testing",
  },
];

const exchanges = [
  {
    name: "Alpaca",
    markets: "Stocks, ETFs, commodity-linked ETFs and selected crypto pairs",
    connection: "Paper/sandbox API keys first; live execution disabled at launch",
    stage: "Core launch connector",
  },
  {
    name: "Kraken",
    markets: "Crypto assets",
    connection: "Read-only and paper/simulation workflow first",
    stage: "Crypto connector path",
  },
  {
    name: "Coinbase",
    markets: "Crypto assets",
    connection: "OAuth or restricted API-key connection preferred",
    stage: "Planned connector",
  },
  {
    name: "Binance",
    markets: "Crypto assets; futures only as a later research-only category",
    connection: "Restricted API keys; no withdrawal permission; live execution later only after review",
    stage: "Planned connector",
  },
  {
    name: "Bitpanda",
    markets: "Crypto, stocks/ETFs and metals where supported by user account region",
    connection: "Watchlist/research integration first",
    stage: "Roadmap option",
  },
  {
    name: "Uphold",
    markets: "Crypto and multi-asset watchlist support",
    connection: "Read-only portfolio import if available",
    stage: "Roadmap option",
  },
  {
    name: "Bitget / Bybit / OKX",
    markets: "Crypto spot and derivatives research",
    connection: "Research-only or restricted API-key mode first",
    stage: "Advanced roadmap option",
  },
  {
    name: "TradingView",
    markets: "Charts, watchlists and market context",
    connection: "Charting and watchlist integration, not order execution",
    stage: "Research layer option",
  },
];

const connectionModes = [
  {
    title: "Demo mode",
    body: "Users can explore Elexa with sample data and no exchange connection. This is the safest first experience for beginners.",
  },
  {
    title: "Read-only connection",
    body: "Users connect an exchange only for balances, positions or watchlists. This should never allow withdrawals or live orders.",
  },
  {
    title: "Paper/sandbox API keys",
    body: "Users can test simulated orders through supported sandbox or paper environments where available.",
  },
  {
    title: "Future approved execution",
    body: "Real-money execution should remain disabled until legal, compliance, security and partner reviews are complete.",
  },
];

export default function MarketsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Markets and connections
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Research more markets. Connect safely.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa supports research and simulated strategy testing across stocks,
          ETFs, crypto assets and commodity-linked ETFs. Launch mode is
          simulation only and does not place real-money trades.
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Market coverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market) => (
            <div
              key={market.title}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold mb-2">{market.title}</h3>
              <p className="text-indigo-300 text-sm mb-3">{market.examples}</p>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {market.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Exchange and data options</h2>
        <div className="overflow-hidden border border-[var(--card-border)] rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 bg-[var(--card)] text-sm font-semibold">
            <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--card-border)]">
              Platform
            </div>
            <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--card-border)]">
              Markets
            </div>
            <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--card-border)]">
              Safer connection method
            </div>
            <div className="p-4">Stage</div>
          </div>
          {exchanges.map((exchange) => (
            <div
              key={exchange.name}
              className="grid grid-cols-1 md:grid-cols-4 text-sm border-t border-[var(--card-border)]"
            >
              <div className="p-4 font-semibold">{exchange.name}</div>
              <div className="p-4 text-[var(--muted)]">{exchange.markets}</div>
              <div className="p-4 text-[var(--muted)]">{exchange.connection}</div>
              <div className="p-4 text-indigo-300">{exchange.stage}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Connection modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {connectionModes.map((mode, index) => (
            <div
              key={mode.title}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-4">
                {index + 1}
              </div>
              <h3 className="font-semibold mb-2">{mode.title}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {mode.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-amber-100 mb-3">
          Security rule for API keys
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed max-w-3xl mx-auto">
          Users should never connect exchange keys with withdrawal permission.
          The safest launch approach is demo mode, read-only access and
          paper/sandbox keys. Real-money execution should stay disabled until
          the product has completed legal, compliance and security review.
        </p>
      </section>

      <div className="text-center mt-12">
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Open Research Dashboard
        </Link>
      </div>
    </div>
  );
}
