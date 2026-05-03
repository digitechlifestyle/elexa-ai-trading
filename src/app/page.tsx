import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import InteractiveAgents from "@/components/InteractiveAgents";

export const metadata: Metadata = {
  title: "Elexa AI Trading | AI-Powered Paper Trading Research Platform",
  description:
    "Explore AI-assisted paper trading with Elexa. Multi-agent analysis, trade journals, and risk management — all in simulated mode. Not financial advice.",
};

const features = [
  {
    icon: "🤖",
    title: "6 AI Agents",
    desc: "CEO, Quant, Risk, Compliance, SEO, and Support agents work together. Each decision is validated and logged.",
  },
  {
    icon: "🪙",
    title: "Stocks & Crypto",
    desc: "Trade stocks via Alpaca. Trade crypto (BTC, XRP, SOL, top 100) via Kraken. Coming: Coinbase, Binance.",
  },
  {
    icon: "⚡",
    title: "Multi-Exchange",
    desc: "Plug in your own API keys. We route trades to your choice of exchange. You control the connection.",
  },
  {
    icon: "📓",
    title: "Trade Journal",
    desc: "Every AI decision is logged with full reasoning. Review agent recommendations and outcomes.",
  },
  {
    icon: "🛡️",
    title: "Risk Management",
    desc: "Hard stop-loss limits, max position sizes, daily loss caps. Enforced server-side — no override.",
  },
  {
    icon: "🔐",
    title: "Encrypted API Keys",
    desc: "Your exchange credentials are stored encrypted. Full audit log of every trade and AI decision.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative px-6 py-28 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Paper Trading Mode — No Real Money
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          AI Agents That Research.
          <br />
          <span className="text-indigo-400">You Decide What&apos;s Real.</span>
        </h1>

        <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10">
          Elexa deploys a team of specialised AI agents to analyse markets,
          validate strategies, and execute paper trades — so you can study
          algorithmic approaches safely before touching real capital.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Open Paper Dashboard
          </Link>
          <Link
            href="/pricing"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Pricing
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--muted)]">
          For research and education only. Not financial advice.{" "}
          <Link href="/disclaimer" className="underline hover:text-white">
            Read full disclaimer →
          </Link>
        </p>

        {/* Social Share Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a
            href={`https://twitter.com/intent/tweet?text=Elexa AI Trading - AI agents for paper trading&url=https://elexa-ai-trading.vercel.app&hashtags=AI,Trading,Research`}
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
            href={`https://www.pinterest.com/pin/create/button/?url=https://elexa-ai-trading.vercel.app&description=Elexa AI Trading`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share on Pinterest"
          >
            📌
          </a>
          <a
            href={`https://reddit.com/submit?url=https://elexa-ai-trading.vercel.app&title=Elexa AI Trading`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share on Reddit"
          >
            🔴
          </a>
          <a
            href={`mailto:?subject=Elexa AI Trading&body=Check out Elexa AI Trading - AI agents for paper trading: https://elexa-ai-trading.vercel.app`}
            className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg text-xs transition-colors"
            title="Share via Email"
          >
            ✉️
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-[var(--card)] border-y border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How Elexa Works
          </h2>
          <p className="text-center text-[var(--muted)] mb-14 max-w-xl mx-auto">
            A structured team of AI agents — each with a defined role and hard
            risk limits they cannot override.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-6 hover:border-indigo-700 transition-colors"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent org chart — Interactive */}
      <InteractiveAgents />

      {/* CTA */}
      <section className="px-6 py-20 bg-indigo-950 border-y border-indigo-900 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Start Paper Trading Today — Free
        </h2>
        <p className="text-indigo-300 mb-8 max-w-lg mx-auto">
          No credit card required for paper trading. Study AI-driven strategies
          risk-free before deciding if live deployment is right for you.
        </p>
        <Link
          href="/dashboard"
          className="bg-white text-indigo-900 hover:bg-indigo-100 px-10 py-3 rounded-lg font-semibold transition-colors inline-block"
        >
          Get Started Free
        </Link>
        <p className="mt-4 text-indigo-400 text-xs">
          Paper trading only. Real money trading is not available.
        </p>
      </section>
    </div>
  );
}
