import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// Static content map — swap for a CMS (Contentful, Sanity, etc.) in production
const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "what-is-paper-trading": {
    title: "What Is Paper Trading? A Beginner's Guide",
    date: "2025-01-15",
    category: "Education",
    content: `Paper trading, also called simulated trading or virtual trading, is the practice of making hypothetical trades without using real money. Traders and researchers use paper trading to test strategies, learn platform mechanics, and study market behaviour in a risk-free environment.

## How Paper Trading Works

In a paper trading environment, orders are executed against real market data but no actual capital changes hands. When you "buy" 10 shares of a stock in a paper account, your simulated balance decreases by the current price × quantity. When you "sell", your balance increases accordingly.

Platforms like Alpaca Markets provide free paper trading APIs that mirror their live trading infrastructure — the same order types, market data feeds, and account structures — making the transition to live trading more straightforward when and if appropriate.

## Why Paper Trading Matters

Before risking real capital, paper trading allows you to:

- **Test strategies** without financial consequence
- **Learn platform mechanics** and order types
- **Identify system bugs** in automated trading code
- **Build a track record** of simulated performance

## Important Limitations

Paper trading does not fully replicate live trading. Key differences include:

- **No slippage**: Real orders move market prices; simulated orders often assume instant full fills
- **No liquidity risk**: Illiquid securities may be impossible to exit at simulated prices in live markets
- **No emotional pressure**: The psychological impact of real money is absent
- **Survivorship bias**: Strategies that perform well in simulation often underperform live

**This platform uses paper trading exclusively. No real money is involved. Past simulated performance does not guarantee real-world results.**`,
  },
  "ai-agents-in-trading": {
    title: "How AI Agents Analyse Market Signals",
    date: "2025-01-22",
    category: "AI & Technology",
    content: `AI language models can process and summarise large volumes of market-related text — news, earnings reports, technical analysis descriptions — and generate structured outputs that trading research platforms can use as signals.

## What Elexa's Agents Do

Elexa deploys six specialised AI agents with defined roles:

- **Quant Agent**: Analyses incoming data and proposes paper trade ideas with reasoning
- **Risk Agent**: Validates every proposal against hard-coded risk limits (stop-loss, max position, daily loss cap)
- **CEO Agent**: Orchestrates the team and produces weekly summaries
- **Compliance Agent**: Flags any content that implies guaranteed returns or regulated financial advice
- **SEO Agent**: Generates educational blog content
- **Support Agent**: Answers user questions about the platform

## Critical Limitations

AI agents are **not** reliable predictors of market prices or directions. Key limitations:

- Models have training data cutoffs and cannot access real-time news
- AI outputs can be confidently incorrect (hallucinations)
- Market dynamics are influenced by non-linguistic factors AI cannot process
- Backtested AI decisions cannot be assumed to generalise forward

**AI signals on this platform are experimental research tools only. Do not use them as the basis for real investment decisions.**`,
  },
  "stop-loss-risk-management": {
    title: "Stop-Loss Orders and Risk Management Fundamentals",
    date: "2025-02-01",
    category: "Risk Management",
    content: `Risk management is the discipline of limiting potential losses in trading. Even the most sophisticated strategies require explicit rules about when to exit losing positions.

## Stop-Loss Orders

A stop-loss order automatically closes a position when it reaches a specified loss threshold. For example, setting a 5% stop-loss on a position means if the price drops 5% from your entry, the position is closed automatically.

Elexa enforces stop-loss limits server-side — agents cannot submit orders that would violate configured risk thresholds.

## Position Sizing

Position sizing determines how much capital to allocate per trade. Common approaches include:

- **Fixed dollar amount**: Never risk more than $X per trade
- **Percentage of portfolio**: Risk only 1–2% of total capital per position
- **Volatility-based**: Size positions inversely to recent price volatility

## Daily Loss Limits

A daily loss limit halts trading when cumulative losses exceed a threshold for the day. This prevents a series of bad trades from compounding into a catastrophic drawdown.

Elexa's paper trading system enforces configurable daily loss caps. When the limit is hit, no further paper orders can be submitted until the next trading day.

**These concepts apply to simulated paper trading on this platform. Real trading involves additional complexities and risks not represented here.**`,
  },
};

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return {};
  return {
    title: post.title,
    description: `${post.title} — Educational content on paper trading and AI-assisted research. Not financial advice.`,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n");

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-[var(--muted)] hover:text-white mb-8 inline-block"
      >
        ← Back to blog
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full">
          {post.category}
        </span>
        <span className="text-xs text-[var(--muted)]">{post.date}</span>
      </div>

      <h1 className="text-4xl font-bold mb-8">{post.title}</h1>

      <div className="prose prose-invert prose-sm max-w-none space-y-4">
        {paragraphs.map((p, i) => {
          if (p.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-semibold mt-8 mb-3">
                {p.replace("## ", "")}
              </h2>
            );
          }
          if (p.startsWith("- **")) {
            const items = p.split("\n").filter(Boolean);
            return (
              <ul key={i} className="list-disc list-inside space-y-1 text-[var(--muted)] text-sm">
                {items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }} />
                ))}
              </ul>
            );
          }
          if (p.startsWith("**") && p.endsWith("**")) {
            return (
              <p key={i} className="font-semibold text-amber-300 text-sm border-l-2 border-amber-700 pl-4">
                {p.replace(/\*\*/g, "")}
              </p>
            );
          }
          return (
            <p key={i} className="text-[var(--muted)] leading-relaxed text-sm">
              {p}
            </p>
          );
        })}
      </div>

      <div className="mt-12 p-4 bg-amber-950 border border-amber-800 rounded-lg text-xs text-amber-300">
        <strong>Disclaimer:</strong> This article is for educational purposes
        only and does not constitute financial advice. Trading involves
        substantial risk of loss.{" "}
        <Link href="/disclaimer" className="underline">
          Read full disclaimer
        </Link>
      </div>
    </div>
  );
}
