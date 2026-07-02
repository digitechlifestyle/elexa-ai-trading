import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description:
    "How Elexa AI Trading protects users with demo mode, read-only connections, paper/sandbox workflows and clear risk controls.",
};

const principles = [
  {
    title: "Research first",
    body: "Elexa is designed for market research, risk review, journaling and simulated strategy testing. It is not a signal service, broker, exchange or financial adviser.",
  },
  {
    title: "Demo mode by default",
    body: "New users can explore the platform with sample data before connecting any exchange, broker or API key.",
  },
  {
    title: "No withdrawal keys",
    body: "Users should never connect exchange API keys with withdrawal, transfer or full-account permissions.",
  },
  {
    title: "Paper and sandbox first",
    body: "Where API access is used, Elexa should prefer paper-trading, sandbox or read-only workflows before any future execution feature is considered.",
  },
];

const safetyChecks = [
  "No real-money execution in launch mode.",
  "No personal financial advice or guaranteed returns.",
  "No withdrawal-enabled API keys.",
  "Read-only or paper/sandbox connections first.",
  "Clear warnings before users add any external connection.",
  "AI output must be treated as research support, not instruction.",
  "Users remain responsible for decisions made outside Elexa.",
  "Live trading requires legal, compliance and security review before release.",
];

const apiRules = [
  {
    title: "Read-only keys",
    body: "Best for balances, holdings, watchlists and portfolio context. They should not allow orders, transfers or withdrawals.",
  },
  {
    title: "Paper / sandbox keys",
    body: "Best for testing workflows without real capital. This is the preferred route for simulated trading features.",
  },
  {
    title: "Trading keys",
    body: "Not part of launch mode. Any future execution flow should be reviewed legally, protected with strict permissions and never allow withdrawals.",
  },
];

const aiLimits = [
  "AI can misunderstand market events, stale data, screenshots, news or user intent.",
  "AI research can be incomplete, outdated or wrong.",
  "Backtests, simulations and paper results do not predict future performance.",
  "Markets can move quickly and losses can occur outside any modelled scenario.",
];

export default function TrustPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Trust and safety
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Built for safer research, not reckless execution.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Elexa AI Trading helps users research markets, review risk, build
          watchlists and test ideas in simulation. Launch mode does not place
          real-money trades and should never request withdrawal-enabled API keys.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {principles.map((principle) => (
          <div
            key={principle.title}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
          >
            <h2 className="font-semibold text-lg mb-3">{principle.title}</h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {principle.body}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-amber-100 mb-4">
          Non-negotiable launch rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {safetyChecks.map((check) => (
            <div key={check} className="flex gap-3 text-amber-200 text-sm">
              <span className="text-amber-400">✓</span>
              <span>{check}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">API key safety</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apiRules.map((rule) => (
            <div
              key={rule.title}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6"
            >
              <h3 className="font-semibold mb-3">{rule.title}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">AI limitations</h2>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <ul className="space-y-3 text-[var(--muted)] text-sm leading-relaxed">
            {aiLimits.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-indigo-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">What users control</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Users choose their market focus, watchlist, connection mode and
            whether to act outside Elexa. Elexa should support better thinking,
            not replace personal responsibility or professional advice.
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">What Elexa should avoid</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Elexa should avoid claims such as guaranteed profit, passive income,
            hands-free AI trading, copy our signals, or turn on live trading.
            The public promise should remain: research smarter and test before
            you trade.
          </p>
        </div>
      </section>

      <section className="text-center bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">Start safely</h2>
        <p className="text-indigo-300 max-w-2xl mx-auto mb-6">
          Begin with demo mode, build a watchlist and use the research workflow
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
            href="/markets"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View Markets & Connections
          </Link>
          <Link
            href="/disclaimer"
            className="border border-indigo-700 hover:border-indigo-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Read Full Disclaimer
          </Link>
        </div>
      </section>
    </div>
  );
}
