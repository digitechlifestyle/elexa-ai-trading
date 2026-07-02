import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Elexa AI Trading roadmap for launch features, exchange connections, AI tools, safety reviews and future execution conditions.",
};

const phases = [
  {
    title: "Ready for launch positioning",
    status: "Now",
    items: [
      "AI market research positioning",
      "Simulation-first product promise",
      "Homepage demo-mode path",
      "Pricing page with safer wording",
      "Risk disclaimer, Trust & Safety and FAQ pages",
      "Markets, features and exchange-connection overview pages",
    ],
  },
  {
    title: "Core app experience",
    status: "Next",
    items: [
      "Beginner onboarding flow",
      "Demo mode with sample market data",
      "Starter watchlists for stocks, crypto, ETFs and mixed markets",
      "Dashboard connections page",
      "Clear read-only and paper/sandbox connection guidance",
      "Cleaner public navigation and launch route",
    ],
  },
  {
    title: "Exchange and platform roadmap",
    status: "Planned",
    items: [
      "Alpaca Paper for stocks, ETFs and selected crypto simulation",
      "TradingView charting and watchlist research layer",
      "Kraken, Coinbase, Binance, Bitget, Bybit, OKX, BYDFi, Bitrue and Crypto.com research connectors",
      "Bitpanda, Uphold, Robinhood and Interactive Brokers as later roadmap options",
      "No withdrawal-enabled API keys",
      "Read-only or paper/sandbox connections first",
    ],
  },
  {
    title: "AI and research upgrades",
    status: "Planned",
    items: [
      "More structured AI research agents",
      "Portfolio Q&A and AI review improvements",
      "Market news summaries with clear source handling",
      "Risk-first trade plan generation",
      "Journal analysis and decision-pattern review",
      "Beginner explanations for complex indicators and market terms",
    ],
  },
  {
    title: "Safety, legal and compliance",
    status: "Required before advanced features",
    items: [
      "Legal review for target markets and financial-promotion rules",
      "Security review for API key storage and permissions",
      "Audit logging and user consent flows",
      "Kill switch and risk-control design",
      "Clear terms, privacy policy and full risk warnings",
      "Live execution disabled until reviews are complete",
    ],
  },
];

const liveConditions = [
  "Legal and compliance review completed for each target jurisdiction.",
  "API-key storage and encryption reviewed by a qualified security professional.",
  "Withdrawal and transfer permissions blocked by design.",
  "Clear opt-in consent, audit logs and user-visible risk controls.",
  "Broker/exchange partner terms reviewed and followed.",
  "Emergency kill switch and strict limits tested.",
  "Plain-English warnings shown before any execution-related action.",
];

export default function RoadmapPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Product roadmap
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Building Elexa in safe, useful stages.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa should grow from a research and simulation platform into a more
          complete market workflow. The roadmap keeps safety, trust and clear
          user control ahead of risky automation.
        </p>
      </section>

      <section className="space-y-6 mb-16">
        {phases.map((phase, index) => (
          <div
            key={phase.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{phase.title}</h2>
                  <p className="text-[var(--muted)] text-sm mt-1">
                    {phase.status}
                  </p>
                </div>
              </div>
              <span className="text-xs rounded-full border border-indigo-800 bg-indigo-950 text-indigo-300 px-3 py-1 w-fit">
                {phase.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phase.items.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-[var(--muted)]">
                  <span className="text-indigo-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-4">
          Future live-trading conditions
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed mb-6">
          Live trading should not be treated as a launch feature. It should only
          be considered after strict legal, security and risk reviews are complete.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {liveConditions.map((condition) => (
            <div key={condition} className="flex gap-3 text-amber-200 text-sm">
              <span className="text-amber-400">•</span>
              <span>{condition}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-bold text-lg mb-3">Now</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Focus on demo mode, public trust pages, clear market coverage and a
            safer research-first message.
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-bold text-lg mb-3">Next</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Improve onboarding, dashboard clarity, exchange connection cards and
            AI research workflows.
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="font-bold text-lg mb-3">Later</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Consider advanced integrations only after compliance, security and
            user-protection reviews are complete.
          </p>
        </div>
      </section>

      <section className="text-center bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">Start with the safe route</h2>
        <p className="text-indigo-300 max-w-2xl mx-auto mb-6">
          Try demo mode, review supported markets and read the safety guidance
          before connecting any platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-white text-indigo-900 hover:bg-indigo-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Demo Setup
          </Link>
          <Link
            href="/features"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Features
          </Link>
          <Link
            href="/trust"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Read Trust &amp; Safety
          </Link>
        </div>
      </section>
    </div>
  );
}
