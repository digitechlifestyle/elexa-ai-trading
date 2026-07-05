import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Elexa AI Trading, demo mode, supported markets, exchange connections and safety rules.",
};

const faqs = [
  {
    question: "Is Elexa AI Trading financial advice?",
    answer:
      "No. Elexa is a research, education, journaling and simulated strategy-testing platform. It does not provide personal financial advice, regulated investment recommendations or guaranteed returns.",
  },
  {
    question: "Can Elexa trade for me?",
    answer:
      "No. Launch mode does not place real-money trades. Elexa helps users research, test ideas in simulation and review risk before they make their own decisions elsewhere.",
  },
  {
    question: "Do I need API keys to start?",
    answer:
      "No. Users can start in demo mode with sample data. API keys are not required to explore the platform, build a watchlist or understand the research workflow.",
  },
  {
    question: "What is demo mode?",
    answer:
      "Demo mode lets users explore Elexa without connecting an exchange, broker or wallet. It is the safest starting point for beginners.",
  },
  {
    question: "What markets are supported?",
    answer:
      "Elexa is positioned around research and simulation for stocks, ETFs, crypto assets and commodity-linked ETFs such as GLD, SLV, USO and UNG. It should not claim full physical commodities, forex, futures, options or live execution unless those features are clearly implemented and reviewed.",
  },
  {
    question: "Which exchanges and platforms are planned?",
    answer:
      "The roadmap includes Alpaca, TradingView, Kraken, Coinbase, Binance, Bitget, Bybit, OKX, BYDFi, Bitrue, Crypto.com, Robinhood, Bitpanda, Uphold and Interactive Brokers. Some are core launch or high-priority research layers; others are roadmap options.",
  },
  {
    question: "Is crypto supported?",
    answer:
      "Yes, crypto research and watchlists are part of the Elexa roadmap. BTC, ETH, XRP, SOL, ADA, HBAR, XLM, XDC, USDT, USDC and other assets can be used as research/watchlist examples. This does not mean live trading is enabled at launch.",
  },
  {
    question: "Is my money safe?",
    answer:
      "Launch mode should not connect to real funds for execution. Users should start with demo mode, read-only connections or paper/sandbox keys. Elexa should never request withdrawal-enabled API keys.",
  },
  {
    question: "What API permissions should I use?",
    answer:
      "Only read-only or paper/sandbox permissions should be used for launch workflows. Users should never provide keys with withdrawal, transfer or full-account permissions.",
  },
  {
    question: "Can AI be wrong?",
    answer:
      "Yes. AI-generated research can be incorrect, incomplete, outdated or misunderstood. Users should treat AI output as research support, not an instruction to buy, sell or trade.",
  },
  {
    question: "Do backtests or paper results guarantee future profit?",
    answer:
      "No. Simulations, paper trades and backtests do not predict future performance. Markets can change quickly and real trading can result in losses.",
  },
  {
    question: "When will live trading be available?",
    answer:
      "Live trading should remain disabled until legal, compliance, security, key-management and risk-control reviews are complete. The safer launch promise is research smarter and test before you trade.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <section className="text-center mb-14">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Frequently asked questions
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Clear answers before users connect anything.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa is built around demo mode, research, risk review and simulated
          strategy testing. These answers explain what the platform does — and
          what it deliberately does not do at launch.
        </p>
      </section>

      <section className="space-y-4 mb-14">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-3">{faq.question}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Still unsure?</h2>
        <p className="text-indigo-300 max-w-2xl mx-auto mb-6">
          Start in demo mode first. You can explore Elexa safely before adding
          any exchange, broker or API connection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-white text-indigo-900 hover:bg-indigo-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Demo Setup
          </Link>
          <Link
            href="/trust"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Read Trust &amp; Safety
          </Link>
          <Link
            href="/markets"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Markets
          </Link>
        </div>
      </section>
    </div>
  );
}
