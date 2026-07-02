import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Supported Assets & Watchlists",
  description:
    "Explore the Elexa watchlist universe for crypto assets, stablecoins, stocks, ETFs and commodity-linked market examples.",
};

const groups = [
  {
    title: "Major crypto assets",
    note: "Large, widely followed crypto assets for research and watchlists.",
    assets: [
      "BTC", "ETH", "XRP", "SOL", "BNB", "ADA", "DOGE", "TRX", "AVAX", "DOT", "LINK", "LTC", "BCH", "TON", "SUI", "APT", "NEAR", "ARB", "OP", "ATOM",
    ],
  },
  {
    title: "Utility and payments tokens",
    note: "Assets often discussed around payments, settlement, interoperability, compliance, enterprise use cases or real-world utility.",
    assets: [
      "XRP", "XLM", "HBAR", "XDC", "QNT", "SHX", "ALGO", "VET", "IOTA", "FLR", "SGB", "JASMY", "CSPR", "LCX", "CSPR", "CANTO", "CSPR", "AXL", "ZBCN", "CSPR",
    ],
  },
  {
    title: "DeFi and infrastructure tokens",
    note: "Research examples for decentralised finance, data, or blockchain infrastructure coverage.",
    assets: [
      "AAVE", "UNI", "MKR", "LDO", "CRV", "SUSHI", "COMP", "SNX", "GRT", "FIL", "RNDR", "FET", "TAO", "ONDO", "PENDLE", "INJ", "RUNE", "TIA", "SEI", "WLD",
    ],
  },
  {
    title: "Meme and high-volatility watchlist",
    note: "Very high-risk assets for research only. These should be clearly marked as speculative.",
    assets: [
      "DOGE", "SHIB", "PEPE", "BONK", "WIF", "FLOKI", "BRETT", "MOG", "TURBO", "PENGU", "TRUMP", "MEME",
    ],
  },
  {
    title: "Stablecoins and tokenised dollars",
    note: "Stablecoin examples for research and education. Stablecoins still carry issuer, reserve, liquidity, regulatory and de-peg risk.",
    assets: [
      "USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "USDe", "DAI", "USDD", "TUSD", "GUSD", "FRAX", "LUSD", "USDP", "EURC", "EURT", "USDG", "USD1",
    ],
  },
  {
    title: "Major stocks",
    note: "Common examples for stock watchlists and AI/technology research.",
    assets: [
      "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "AMD", "AVGO", "ORCL", "NFLX", "ADBE", "CRM", "INTC", "IBM", "PLTR", "ARM", "SMCI", "MU", "TSM",
    ],
  },
  {
    title: "Financial, consumer and industrial stocks",
    note: "Broader stock examples for diversification and market comparison research.",
    assets: [
      "JPM", "BAC", "GS", "MS", "V", "MA", "PYPL", "SQ", "COIN", "HOOD", "BRK.B", "WMT", "COST", "MCD", "NKE", "DIS", "BA", "CAT", "GE", "XOM",
    ],
  },
  {
    title: "Core ETFs",
    note: "Broad market ETF examples for index, sector and portfolio research.",
    assets: [
      "SPY", "VOO", "IVV", "QQQ", "VTI", "DIA", "IWM", "VEA", "VWO", "EFA", "ARKK", "SCHD", "VUG", "VTV", "XLK", "XLF", "XLE", "XLV", "XLI", "XLY",
    ],
  },
  {
    title: "Commodity-linked and bond ETFs",
    note: "ETF examples that track gold, silver, oil, gas, bonds or treasury exposure. These are not the same as direct physical commodities.",
    assets: [
      "GLD", "IAU", "SLV", "USO", "UNG", "DBC", "PDBC", "TLT", "IEF", "SHY", "BIL", "HYG", "LQD", "TIP", "AGG", "BND",
    ],
  },
  {
    title: "Crypto-related equities and ETFs",
    note: "Public equities and funds often used to research crypto market exposure.",
    assets: [
      "COIN", "HOOD", "MSTR", "MARA", "RIOT", "CLSK", "HUT", "BITF", "IBIT", "FBTC", "ARKB", "BITB", "GBTC", "ETHE", "ETHA", "FETH",
    ],
  },
];

const warnings = [
  "Being listed here does not mean live trading is available.",
  "Being listed here does not mean Elexa recommends the asset.",
  "Some assets may not be available on every exchange, broker or data provider.",
  "Stablecoins can still lose their peg or face issuer, liquidity and regulatory risk.",
  "Crypto assets can be highly volatile and may lose most or all of their value.",
  "Stocks and ETFs also carry market risk and can fall sharply.",
];

export default function AssetsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Supported assets and watchlists
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          A broader watchlist universe for research.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa can organise crypto assets, stablecoins, stocks, ETFs and
          commodity-linked ETFs into research watchlists. This page is a
          research universe, not a promise of live trading support.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-4">
          Important asset warning
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {warnings.map((warning) => (
            <div key={warning} className="flex gap-3 text-amber-200 text-sm">
              <span className="text-amber-400">•</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        {groups.map((group) => (
          <div
            key={group.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-2">{group.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
              {group.note}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(group.assets)).map((asset) => (
                <span
                  key={asset}
                  className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-full px-3 py-1 text-[var(--muted)]"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold mb-4">Launch interpretation</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">
          At launch, this should be treated as a watchlist and research universe.
          The safest implementation is to let users search, save, compare and
          research these assets while keeping execution disabled.
        </p>
        <p className="text-[var(--muted)] text-sm leading-relaxed">
          Exchange and broker availability should be handled separately through
          the Connections page. For example, an asset may appear in research but
          may not be supported by Alpaca, Kraken, Coinbase, Binance, Bitget,
          Bybit, OKX, BYDFi, Bitrue, Crypto.com, Robinhood or Interactive Brokers.
        </p>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-3">Build your first watchlist</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          Start safely in demo mode, then choose the assets you want to research.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Demo Setup
          </Link>
          <Link
            href="/markets"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Markets
          </Link>
          <Link
            href="/trust"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Read Trust &amp; Safety
          </Link>
        </div>
      </section>
    </div>
  );
}
