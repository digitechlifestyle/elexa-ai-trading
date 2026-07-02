import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Elexa AI Trading features for AI research, market scanning, risk tools, journaling, simulation and exchange connections.",
};

const featureGroups = [
  {
    title: "AI Research",
    icon: "🤖",
    body: "Use AI-assisted workflows to summarise market context, compare symbols, review news, ask portfolio questions and organise research notes.",
    tools: ["AI Agents", "News + AI", "Portfolio Q&A", "AI Review", "AI Trade Plan"],
  },
  {
    title: "Market Scanners",
    icon: "🔭",
    body: "Find market setups, movers, breakouts, sector strength and technical conditions before adding ideas to a watchlist.",
    tools: ["Market Scanners", "Top Movers", "52w Scanner", "Gap Scanner", "Strength Meter"],
  },
  {
    title: "Risk Tools",
    icon: "🛡️",
    body: "Check risk before an idea becomes a problem. Review position size, drawdown, concentration, volatility and stress scenarios.",
    tools: ["Position Size", "Risk Metrics", "Stress Test", "Concentration", "Monte Carlo"],
  },
  {
    title: "Portfolio Tools",
    icon: "📈",
    body: "Track simulated portfolios, symbol performance, trade stats, allocation ideas and portfolio health in one research dashboard.",
    tools: ["Analytics", "Health Score", "Symbol Stats", "Efficient Frontier", "Allocator"],
  },
  {
    title: "Journaling",
    icon: "📓",
    body: "Record the reason behind every simulated decision, then review what worked, what failed and what needs improvement.",
    tools: ["Journal", "Journal AI", "Trade Grader", "Audit Log", "Tag Analytics"],
  },
  {
    title: "Simulation",
    icon: "🧪",
    body: "Test ideas in a controlled environment before risking real capital elsewhere. Launch mode stays simulation-first.",
    tools: ["Backtest", "Strategy Builder", "Strategy Templates", "Paper Portfolio", "DCA Simulator"],
  },
  {
    title: "Exchange Connections",
    icon: "🔌",
    body: "Start with demo mode, read-only access or paper/sandbox keys. Never use withdrawal-enabled API keys.",
    tools: ["Demo Mode", "Alpaca Paper", "Kraken Research", "TradingView", "Crypto Connectors"],
  },
  {
    title: "Education & Safety",
    icon: "📚",
    body: "Plain-English guidance helps users understand risk, AI limitations, supported markets and safe connection rules.",
    tools: ["User Guide", "FAQ", "Trust & Safety", "Risk Disclaimer", "Markets Page"],
  },
];

const launchFlow = [
  "Start in demo mode with no exchange keys.",
  "Choose a market focus: crypto, stocks, ETFs or mixed markets.",
  "Build a first watchlist.",
  "Use AI research, scanners and risk tools to review ideas.",
  "Test strategies in simulation and journal the decision.",
  "Add read-only or paper/sandbox connections later if needed.",
];

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Features overview
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          One dashboard for research, risk and simulation.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa brings AI research, scanners, watchlists, risk tools,
          journaling and simulation together so users can build a better
          decision process before acting outside the platform.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {featureGroups.map((group) => (
          <div
            key={group.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <div className="text-3xl mb-4">{group.icon}</div>
            <h2 className="text-xl font-bold mb-3">{group.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
              {group.body}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-full px-3 py-1 text-[var(--muted)]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-indigo-400 text-sm font-semibold mb-3">
              Recommended user flow
            </p>
            <h2 className="text-2xl font-bold mb-4">
              From beginner setup to reviewed decision
            </h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              The best launch experience is simple: start safe, pick the market,
              build a watchlist, research properly, test in simulation and only
              add external connections when needed.
            </p>
          </div>
          <ol className="space-y-3">
            {launchFlow.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-[var(--muted)]">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 text-center mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Built around safety boundaries
        </h2>
        <p className="text-amber-300 max-w-3xl mx-auto leading-relaxed text-sm">
          Elexa launch mode is for research, education, journaling and simulated
          strategy testing. It does not provide financial advice, guaranteed
          returns or real-money execution.
        </p>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-3">Explore Elexa safely</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          Start with demo mode first, then move into markets, connections and
          dashboard tools when ready.
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
            href="/dashboard"
            className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
