import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Exchange Connections",
  description:
    "Connect exchanges safely in demo, read-only or paper/sandbox mode for Elexa AI Trading.",
};

type ConnectionCard = {
  name: string;
  badge: string;
  markets: string;
  mode: string;
  status: "Available" | "Planned" | "Roadmap";
  description: string;
  cta: string;
  href?: string;
};

const connections: ConnectionCard[] = [
  {
    name: "Demo Mode",
    badge: "Safest start",
    markets: "Sample stocks, ETFs, crypto and portfolio data",
    mode: "No exchange connection required",
    status: "Available",
    description:
      "Explore the dashboard, test workflows and learn the platform with sample data before connecting any account.",
    cta: "Open Demo Data",
    href: "/dashboard/demo",
  },
  {
    name: "Alpaca Paper",
    badge: "Paper/sandbox",
    markets: "Stocks, ETFs, commodity-linked ETFs and selected crypto pairs",
    mode: "Paper API keys only",
    status: "Available",
    description:
      "Use Alpaca paper/sandbox credentials for simulated orders and research workflows. Launch mode does not place real-money trades.",
    cta: "Manage API Keys",
    href: "/dashboard/api-keys",
  },
  {
    name: "Kraken Research",
    badge: "Crypto",
    markets: "Crypto assets",
    mode: "Read-only or research workflow first",
    status: "Planned",
    description:
      "Planned crypto research connector for portfolio context, watchlists and simulated strategy review.",
    cta: "Planned",
  },
  {
    name: "Coinbase",
    badge: "Crypto",
    markets: "Crypto assets",
    mode: "OAuth or restricted API-key connection preferred",
    status: "Planned",
    description:
      "Planned connection option for crypto watchlists, balances and research context. No withdrawal permissions should ever be used.",
    cta: "Coming Soon",
  },
  {
    name: "Binance",
    badge: "Crypto",
    markets: "Crypto spot; futures as later research-only category",
    mode: "Restricted API keys; no withdrawals",
    status: "Planned",
    description:
      "Planned crypto connector. Futures and derivatives should remain research-only unless reviewed legally and technically.",
    cta: "Coming Soon",
  },
  {
    name: "Bitrue",
    badge: "XRP-focused crypto",
    markets: "Crypto assets including XRP-focused markets where supported",
    mode: "Read-only/watchlist first",
    status: "Planned",
    description:
      "Planned crypto connector for users who want XRP-focused market research and portfolio/watchlist context.",
    cta: "Coming Soon",
  },
  {
    name: "Crypto.com",
    badge: "Crypto",
    markets: "Crypto assets and account research where supported",
    mode: "Read-only or restricted API-key workflow first",
    status: "Planned",
    description:
      "Planned connector for crypto research and portfolio context. Withdrawal-enabled keys must not be used.",
    cta: "Coming Soon",
  },
  {
    name: "Bitpanda",
    badge: "UK/EU option",
    markets: "Crypto, stocks/ETFs and metals where regionally supported",
    mode: "Watchlist/research integration first",
    status: "Roadmap",
    description:
      "Roadmap option for wider asset coverage and UK/EU-style portfolio research workflows.",
    cta: "Roadmap",
  },
  {
    name: "Uphold",
    badge: "Multi-asset",
    markets: "Crypto and multi-asset watchlists",
    mode: "Read-only portfolio import if available",
    status: "Roadmap",
    description:
      "Roadmap option for users who want multi-asset portfolio context inside the research dashboard.",
    cta: "Roadmap",
  },
  {
    name: "TradingView",
    badge: "Charts",
    markets: "Charts, watchlists and market context",
    mode: "Research layer only",
    status: "Roadmap",
    description:
      "Charting and watchlist integration option. This should not be used for order execution in launch mode.",
    cta: "Roadmap",
  },
];

const safetyRules = [
  "Never use exchange keys with withdrawal permission.",
  "Start with demo mode or paper/sandbox mode wherever possible.",
  "Use read-only keys for balances, watchlists and research context.",
  "Real-money execution remains disabled in launch mode.",
];

function statusClass(status: ConnectionCard["status"]) {
  if (status === "Available") return "bg-green-950 text-green-300 border-green-800";
  if (status === "Planned") return "bg-indigo-950 text-indigo-300 border-indigo-800";
  return "bg-[var(--background)] text-[var(--muted)] border-[var(--card-border)]";
}

export default function ConnectionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-indigo-400 text-sm font-semibold mb-2">
            Exchange connections
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Connect safely. Research first.
          </h1>
          <p className="text-[var(--muted)] max-w-3xl leading-relaxed">
            Choose demo mode, read-only access or paper/sandbox credentials.
            Elexa launch mode is built for research, journaling and simulated
            strategy testing — not real-money execution.
          </p>
        </div>
        <Link
          href="/markets"
          className="inline-flex justify-center rounded-lg border border-[var(--card-border)] px-5 py-3 text-sm font-semibold hover:border-indigo-600 transition-colors"
        >
          View public markets page
        </Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {safetyRules.map((rule) => (
          <div
            key={rule}
            className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-sm"
          >
            <span className="text-amber-400 mr-2">⚠️</span>
            {rule}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <div
            key={connection.name}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-indigo-300 mb-2">{connection.badge}</p>
                <h2 className="text-xl font-bold">{connection.name}</h2>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${statusClass(
                  connection.status
                )}`}
              >
                {connection.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[var(--muted)] text-xs mb-1">Markets</p>
                <p>{connection.markets}</p>
              </div>
              <div>
                <p className="text-[var(--muted)] text-xs mb-1">Connection mode</p>
                <p>{connection.mode}</p>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                {connection.description}
              </p>
            </div>

            {connection.href ? (
              <Link
                href={connection.href}
                className="mt-auto text-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 text-sm font-semibold transition-colors"
              >
                {connection.cta}
              </Link>
            ) : (
              <button
                disabled
                className="mt-auto rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm font-semibold text-[var(--muted)] cursor-not-allowed"
              >
                {connection.cta}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-3">Recommended launch order</h2>
        <ol className="list-decimal list-inside space-y-2 text-[var(--muted)] text-sm leading-relaxed">
          <li>Use Demo Mode first so every user can explore without keys.</li>
          <li>Use Alpaca Paper for simulated stock, ETF and crypto workflows.</li>
          <li>Add read-only crypto portfolio/watchlist connectors next.</li>
          <li>Keep all live execution disabled until legal and security review is complete.</li>
        </ol>
      </section>
    </div>
  );
}
