import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — AI Trading Research & Education",
  description:
    "Educational articles on algorithmic trading, AI agents, paper trading strategies, and risk management. Not financial advice.",
};

// Static seed posts — replace with CMS/DB-driven content
const posts = [
  {
    slug: "what-is-paper-trading",
    title: "What Is Paper Trading? A Beginner's Guide",
    excerpt:
      "Paper trading lets you practice trading strategies without risking real money. Learn how simulated trading works and why it matters.",
    date: "2025-01-15",
    category: "Education",
    readTime: "5 min",
  },
  {
    slug: "ai-agents-in-trading",
    title: "How AI Agents Analyse Market Signals",
    excerpt:
      "A look at how multi-agent AI systems can research, validate, and journal trading ideas — and their significant limitations.",
    date: "2025-01-22",
    category: "AI & Technology",
    readTime: "8 min",
  },
  {
    slug: "stop-loss-risk-management",
    title: "Stop-Loss Orders and Risk Management Fundamentals",
    excerpt:
      "Understanding stop-loss levels, position sizing, and daily loss limits — core concepts for any trading research framework.",
    date: "2025-02-01",
    category: "Risk Management",
    readTime: "6 min",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-3">Research & Education</h1>
      <p className="text-[var(--muted)] mb-12 text-lg">
        Educational content on AI-assisted paper trading. All articles are for
        research purposes only and do not constitute financial advice.
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block border border-[var(--card-border)] bg-[var(--card)] rounded-xl p-6 hover:border-indigo-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-[var(--muted)]">{post.readTime} read</span>
              <span className="text-xs text-[var(--muted)]">{post.date}</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">{post.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {post.excerpt}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-xs text-[var(--muted)] border-t border-[var(--card-border)] pt-6">
        All content on this blog is for educational purposes only and does not
        constitute financial advice. Trading involves substantial risk of loss.
      </p>
    </div>
  );
}
