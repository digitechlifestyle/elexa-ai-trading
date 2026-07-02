import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beginner Guide",
  description:
    "A plain-English beginner guide to Elexa AI Trading, demo mode, watchlists, AI research, risk checks, simulation and API-key safety.",
};

const guideSections = [
  {
    title: "What Elexa is",
    body: "Elexa is a market research and simulation platform. It helps users organise ideas, build watchlists, ask AI-assisted research questions, check risk and review decisions before acting elsewhere.",
  },
  {
    title: "What Elexa is not",
    body: "Elexa is not a financial adviser, broker, exchange, signal seller, copy-trading system or guaranteed-profit bot. Launch mode does not place real-money trades.",
  },
  {
    title: "What demo mode means",
    body: "Demo mode lets you explore the platform with sample data. You do not need to connect an exchange, broker or API key to learn how the dashboard works.",
  },
  {
    title: "What a watchlist is",
    body: "A watchlist is simply a list of markets you want to follow. For example: BTC, ETH, XRP, SOL, AAPL, NVDA, SPY, QQQ, GLD or SLV.",
  },
  {
    title: "What AI research means",
    body: "AI research means using AI to help summarise information, compare symbols, organise notes and explain ideas in plain English. It is research support, not an instruction to buy or sell.",
  },
  {
    title: "What risk checking means",
    body: "Risk checking means asking what could go wrong before a trade idea becomes serious. This can include position size, loss limits, volatility, concentration and risk/reward.",
  },
  {
    title: "Why simulation matters",
    body: "Simulation lets users test ideas without using real money. It helps beginners learn from mistakes before taking risk outside the platform.",
  },
  {
    title: "Why API-key safety matters",
    body: "API keys can give apps access to exchange or broker accounts. Users should only use read-only or paper/sandbox keys at launch and should never use withdrawal-enabled keys.",
  },
];

const beginnerRules = [
  "Start with demo mode first.",
  "Do not connect real funds just to learn the platform.",
  "Treat AI answers as research support, not instructions.",
  "Use a watchlist before thinking about any trade idea.",
  "Check risk before testing a strategy.",
  "Use simulation before making any real-world decision elsewhere.",
  "Never use withdrawal-enabled API keys.",
  "Do not trust guaranteed-profit claims from any trading tool.",
];

const keyTerms = [
  {
    term: "Symbol",
    meaning: "A short code for a market, such as BTC, ETH, AAPL, NVDA, SPY or GLD.",
  },
  {
    term: "Watchlist",
    meaning: "A saved list of markets you want to follow and research.",
  },
  {
    term: "Paper trading",
    meaning: "A simulated trading environment that does not use real money.",
  },
  {
    term: "Read-only API key",
    meaning: "A safer key that can view information but should not place orders or move funds.",
  },
  {
    term: "Risk/reward",
    meaning: "A simple way to compare possible loss against possible gain before testing an idea.",
  },
  {
    term: "Drawdown",
    meaning: "How much an account, strategy or portfolio falls from a previous high point.",
  },
];

export default function BeginnerGuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Beginner guide
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Elexa explained in plain English.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          This guide is for users who are new to trading tools, AI research,
          watchlists and API keys. The safest way to begin is demo mode.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {guideSections.map((section) => (
          <div
            key={section.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {section.body}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold mb-5">Beginner safety rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {beginnerRules.map((rule) => (
            <div key={rule} className="flex gap-3 text-sm text-[var(--muted)]">
              <span className="text-indigo-400">✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Useful terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyTerms.map((item) => (
            <div
              key={item.term}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
            >
              <h3 className="font-bold text-lg mb-2">{item.term}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {item.meaning}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 text-center mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          The most important warning
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed max-w-3xl mx-auto">
          Elexa does not guarantee profits and does not provide financial advice.
          Markets can move against you. AI can be wrong. Use the platform to
          learn, research and test ideas — not to blindly follow instructions.
        </p>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to learn safely?</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          Start with demo mode, then read how Elexa works and explore the main
          features before connecting anything.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Demo Setup
          </Link>
          <Link
            href="/how-it-works"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/faq"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Read FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
