import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Try Demo Mode",
  description:
    "Try Elexa AI Trading in public demo mode without exchange keys, broker connections or real-money execution.",
};

const demoSteps = [
  {
    title: "1. Pick a market focus",
    body: "Choose crypto, stocks, ETFs or mixed markets so you know what to test first.",
  },
  {
    title: "2. Build a sample watchlist",
    body: "Use example assets like BTC, ETH, XRP, RLUSD, AAPL, NVDA, SPY, QQQ, GLD or SLV.",
  },
  {
    title: "3. Explore the public product pages",
    body: "Use Assets, Markets, Features, FAQ and Trust & Safety before creating an account.",
  },
  {
    title: "4. Create an account only when ready",
    body: "The protected dashboard and saved onboarding still require login, but this public route lets you test the concept first.",
  },
];

const sampleWatchlists = [
  {
    title: "Crypto starter",
    assets: ["BTC", "ETH", "XRP", "XLM", "HBAR", "XDC", "QNT", "ADA", "SOL", "RLUSD", "USDC"],
  },
  {
    title: "AI and tech stocks",
    assets: ["NVDA", "MSFT", "AAPL", "GOOGL", "META", "AMZN", "AMD", "PLTR", "TSM", "AVGO"],
  },
  {
    title: "ETF starter",
    assets: ["SPY", "VOO", "QQQ", "VTI", "DIA", "IWM", "GLD", "SLV", "TLT", "BND"],
  },
];

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Public demo mode
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Test the Elexa idea without logging in first.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          This public demo route lets you review the safe launch flow before
          creating an account. No exchange keys, no broker connection and no
          real-money execution are required.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Why you saw a login screen
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed">
          The full dashboard and saved onboarding are protected because they use
          account data. This public demo page gives you a safe route to test the
          product message, watchlist universe and beginner flow before signing in.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {demoSteps.map((step) => (
          <div
            key={step.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-3">{step.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sample demo watchlists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleWatchlists.map((list) => (
            <div
              key={list.title}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-4">{list.title}</h3>
              <div className="flex flex-wrap gap-2">
                {list.assets.map((asset) => (
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
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Public pages to test now</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          These pages should open without login and show the product clearly.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/assets" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Assets
          </Link>
          <Link href="/markets" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Markets
          </Link>
          <Link href="/features" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Features
          </Link>
          <Link href="/how-it-works" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            How It Works
          </Link>
          <Link href="/faq" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            FAQ
          </Link>
          <Link href="/trust" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Trust & Safety
          </Link>
        </div>
      </section>

      <section className="text-center bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">Ready to save your demo setup?</h2>
        <p className="text-indigo-300 max-w-2xl mx-auto mb-6">
          Create an account only when you want saved onboarding, dashboard access
          and future account-based settings.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="bg-white text-indigo-900 hover:bg-indigo-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Login
          </Link>
        </div>
      </section>
    </div>
  );
}
