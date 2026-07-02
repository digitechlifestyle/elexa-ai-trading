import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import InteractiveAgents from "@/components/InteractiveAgents";
import { features as featureData } from "@/lib/features-data";

export const metadata: Metadata = {
  title: "Elexa AI Trading | AI Market Research, Risk Tools & Strategy Simulator",
  description:
    "Research markets, test strategies, manage risk and journal decisions with Elexa AI Trading. Simulated execution only. Not financial advice.",
};

const launchPillars = [
  {
    icon: "🔎",
    title: "AI Market Research",
    desc: "Use structured AI agents to summarise market context, compare assets, scan technical conditions and organise research notes before making any decision.",
  },
  {
    icon: "🛡️",
    title: "Risk & Portfolio Tools",
    desc: "Check position size, concentration, drawdown, volatility, risk/reward and portfolio health before a trade idea becomes a real-world risk.",
  },
  {
    icon: "🧪",
    title: "Strategy Simulation",
    desc: "Test trade ideas, strategy templates and paper portfolios in a safe simulated environment with no real money execution at launch.",
  },
  {
    icon: "📓",
    title: "Decision Journal",
    desc: "Record the reasoning, agent checks, risk notes and outcomes behind every simulated trade so users can learn from patterns over time.",
  },
];

const proofPoints = [
  "Multi-agent research workflow",
  "Stocks and crypto watchlists",
  "Strategy testing and paper portfolios",
  "Risk checks before every simulated trade",
  "Trade journal, audit trail and review tools",
  "Education-first wording with no guaranteed returns",
];

const launchSteps = [
  "Build a watchlist for crypto, stocks or both.",
  "Use AI research agents to inspect market context and risk.",
  "Test the idea in the simulator before risking real capital elsewhere.",
  "Journal the decision, review results and improve your process.",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  // Catch stray Supabase auth codes that land on the homepage and route them
  // through the proper auth callback handler.
  const { code, next } = await searchParams;
  if (code) {
    const target = `/auth/callback?code=${encodeURIComponent(code)}${
      next ? `&next=${encodeURIComponent(next)}` : "&next=/reset-password"
    }`;
    redirect(target);
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative px-6 py-28 text-center max-w-6xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          AI research, risk tools and simulated strategy testing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Research smarter.
          <br />
          <span className="text-indigo-400">Test before you trade.</span>
        </h1>

        <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto mb-10 leading-relaxed">
          Elexa AI Trading helps users research markets, test strategies,
          manage risk and keep a disciplined trading journal before risking
          real capital elsewhere. Launch mode uses simulated execution only.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Open Research Dashboard
          </Link>
          <Link
            href="/pricing"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Plans
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--muted)] max-w-2xl mx-auto">
          Research and education only. Elexa does not provide financial advice,
          personal investment recommendations, guaranteed returns or real-money
          execution at launch.{" "}
          <Link href="/disclaimer" className="underline hover:text-white">
            Read full disclaimer →
          </Link>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-12 max-w-4xl mx-auto text-left">
          {proofPoints.map((point) => (
            <div
              key={point}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-[var(--muted)]"
            >
              <span className="text-indigo-400 mr-2">✓</span>
              {point}
            </div>
          ))}
        </div>

        {/* Social Share Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a
            href={`https://twitter.com/intent/tweet?text=Elexa AI Trading - AI market research, risk tools and strategy simulation&url=https://elexa-ai-trading.vercel.app&hashtags=AI,Trading,Research,RiskManagement`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share on Twitter"
          >
            𝕏
          </a>
          <a
            href="https://www.linkedin.com/sharing/share-offsite/?url=https://elexa-ai-trading.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share on LinkedIn"
          >
            💼
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=https://elexa-ai-trading.vercel.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share on Facebook"
          >
            📘
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Follow on Instagram"
          >
            📷
          </a>
          <a
            href={`https://www.tiktok.com/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Follow on TikTok"
          >
            🎵
          </a>
          <a
            href={`mailto:?subject=Elexa AI Trading&body=Check out Elexa AI Trading - AI market research, risk tools and strategy simulation: https://elexa-ai-trading.vercel.app`}
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share via Email"
          >
            ✉️
          </a>
        </div>
      </section>

      {/* Launch pillars */}
      <section className="px-6 py-20 bg-[var(--card)] border-y border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-400 text-sm font-semibold mb-3">
              More than paper trading
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A complete research workflow for disciplined traders
            </h2>
            <p className="text-[var(--muted)] max-w-2xl mx-auto">
              Paper trading is only one part of the platform. Elexa is designed
              around research, risk control, simulation and review so users can
              build a repeatable process instead of chasing hype.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {launchPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-6"
              >
                <div className="text-3xl mb-4">{pillar.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{pillar.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-indigo-400 text-sm font-semibold mb-3">
              How launch mode works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From market idea to reviewed decision
            </h2>
            <p className="text-[var(--muted)] mb-6 leading-relaxed">
              Elexa should help users slow down, check the facts, inspect risk
              and review the outcome. That is the launch promise: better process,
              not guaranteed profit.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try the dashboard
            </Link>
          </div>

          <div className="space-y-4">
            {launchSteps.map((step, index) => (
              <div
                key={step}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 flex gap-4"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  {index + 1}
                </div>
                <p className="text-[var(--muted)] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-[var(--card)] border-y border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Explore the Elexa feature guides
          </h2>
          <p className="text-center text-[var(--muted)] mb-14 max-w-2xl mx-auto">
            Each feature should support one of four launch goals: research,
            risk control, simulated testing or disciplined review.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureData.map((f) => (
              <Link
                key={f.slug}
                href={`/features/${f.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-6 hover:border-indigo-600 transition-all hover:scale-[1.02]"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-indigo-400 text-xs mb-2">{f.tagline}</p>
                <p className="text-[var(--muted)] text-sm leading-relaxed mb-3">
                  {f.shortDesc}
                </p>
                <p className="text-indigo-400 text-xs font-medium">
                  Read full guide →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Agent org chart — Interactive */}
      <InteractiveAgents />

      {/* Safety */}
      <section className="px-6 py-16 bg-amber-950 border-y border-amber-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-amber-100">
            Built for education, research and simulation
          </h2>
          <p className="text-amber-300 leading-relaxed">
            Elexa does not provide personal financial advice, regulated
            investment recommendations, guaranteed returns or real-money
            execution at launch. Users remain responsible for any investment
            decisions they make outside the platform.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-indigo-950 border-y border-indigo-900 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Start with research. Test in simulation.
        </h2>
        <p className="text-indigo-300 mb-8 max-w-2xl mx-auto">
          Open the dashboard, build a watchlist and start testing your process
          without connecting real funds or placing live trades.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-white text-indigo-900 hover:bg-indigo-100 px-10 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-10 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            Compare Plans
          </Link>
        </div>
        <p className="mt-4 text-indigo-400 text-xs">
          Launch mode: research, education, journaling and simulated execution only.
        </p>
      </section>
    </div>
  );
}
