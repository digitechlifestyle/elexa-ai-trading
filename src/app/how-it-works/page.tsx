import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "A simple step-by-step guide to using Elexa AI Trading in demo mode, research mode and simulated strategy testing.",
};

const steps = [
  {
    title: "Start in demo mode",
    body: "Begin with sample data and no exchange connection. This lets you learn the dashboard safely before entering any API keys.",
    icon: "🧭",
  },
  {
    title: "Choose your market focus",
    body: "Pick crypto, stocks, ETFs, commodity-linked ETFs or a mixed dashboard so Elexa can shape the first watchlist around your interests.",
    icon: "🎯",
  },
  {
    title: "Build a watchlist",
    body: "Add symbols such as BTC, ETH, XRP, SOL, AAPL, NVDA, SPY, QQQ, GLD or SLV to organise what you want to research.",
    icon: "👀",
  },
  {
    title: "Research with AI",
    body: "Use AI-assisted tools to review market context, compare symbols, summarise ideas and create plain-English research notes.",
    icon: "🤖",
  },
  {
    title: "Check the risk",
    body: "Review position size, volatility, drawdown, concentration, risk/reward and stress scenarios before treating any idea seriously.",
    icon: "🛡️",
  },
  {
    title: "Test in simulation",
    body: "Use paper/sandbox workflows and strategy testing to see how an idea behaves without placing real-money trades at launch.",
    icon: "🧪",
  },
  {
    title: "Journal the decision",
    body: "Record the reason, risk notes, AI checks and outcome so you can learn from patterns instead of guessing or chasing hype.",
    icon: "📓",
  },
  {
    title: "Connect later, safely",
    body: "Only add read-only or paper/sandbox connections when needed. Never use withdrawal-enabled API keys.",
    icon: "🔌",
  },
];

const modes = [
  {
    title: "Demo mode",
    body: "Best for beginners and first-time users. No keys, no connected funds and no real-money execution.",
  },
  {
    title: "Read-only mode",
    body: "Best for watchlists, balances or portfolio context. It should not allow orders, transfers or withdrawals.",
  },
  {
    title: "Paper / sandbox mode",
    body: "Best for testing simulated orders and strategy workflows where a platform supports sandbox or paper trading.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          How it works
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          A safer route from idea to reviewed decision.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa is designed to slow the trading process down: research first,
          check risk, test in simulation, then review the decision. Launch mode
          does not place real-money trades.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 flex gap-4"
          >
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-2xl">
                {step.icon}
              </div>
            </div>
            <div>
              <p className="text-indigo-400 text-xs font-semibold mb-1">
                Step {index + 1}
              </p>
              <h2 className="text-xl font-bold mb-2">{step.title}</h2>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16">
        <div className="text-center mb-8">
          <p className="text-indigo-400 text-sm font-semibold mb-3">
            Connection modes
          </p>
          <h2 className="text-2xl font-bold mb-3">
            Choose the safest mode for your stage
          </h2>
          <p className="text-[var(--muted)] max-w-2xl mx-auto text-sm leading-relaxed">
            The safest launch path is demo first, read-only second and
            paper/sandbox testing only when users understand the platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <div
              key={mode.title}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-6"
            >
              <h3 className="font-bold text-lg mb-3">{mode.title}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {mode.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16 text-center">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Important safety rule
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed max-w-3xl mx-auto">
          Elexa should never request withdrawal-enabled API keys. Launch mode is
          for research, education, journaling and simulated strategy testing —
          not financial advice, signals or guaranteed returns.
        </p>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-3">Start with the safe path</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          Use demo mode first, then explore features, markets and connections
          once you understand the workflow.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Demo Setup
          </Link>
          <Link
            href="/features"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Features
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
