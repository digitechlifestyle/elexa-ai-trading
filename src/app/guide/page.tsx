import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "User Guide — How Elexa Works",
  description:
    "Step-by-step guide to using Elexa AI Trading: signing up, placing paper trades, running AI agents, and using the trade journal.",
};

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block"
      >
        ← Back to home
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">User Guide</h1>
        <p className="text-xl text-[var(--muted)]">
          Get from signed-out to placing your first AI-validated paper trade in
          under 10 minutes.
        </p>
      </div>

      {/* Quick nav */}
      <nav className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 mb-12">
        <h2 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide">
          Contents
        </h2>
        <ol className="space-y-1 text-sm">
          <li><a href="#step-1" className="text-indigo-400 hover:underline">1. Sign up &amp; sign in</a></li>
          <li><a href="#step-2" className="text-indigo-400 hover:underline">2. The dashboard</a></li>
          <li><a href="#step-3" className="text-indigo-400 hover:underline">3. Place your first paper trade</a></li>
          <li><a href="#step-4" className="text-indigo-400 hover:underline">4. Run an AI agent</a></li>
          <li><a href="#step-5" className="text-indigo-400 hover:underline">5. Use the trade journal</a></li>
          <li><a href="#step-6" className="text-indigo-400 hover:underline">6. Risk limits explained</a></li>
          <li><a href="#step-7" className="text-indigo-400 hover:underline">7. Switching exchanges</a></li>
          <li><a href="#troubleshooting" className="text-indigo-400 hover:underline">Troubleshooting</a></li>
          <li><a href="#faq" className="text-indigo-400 hover:underline">FAQ</a></li>
        </ol>
      </nav>

      <section id="step-1" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 1 — Sign up &amp; sign in</h2>
        <p className="mb-3 text-[var(--foreground)]">
          Click <strong>Open Paper Dashboard</strong> on the home page. Choose
          <strong> Sign up</strong>. Enter any email and a password of at least 8
          characters.
        </p>
        <p className="mb-3 text-[var(--foreground)]">
          You&apos;ll land on the dashboard immediately. No card needed. No real
          money involved.
        </p>
        <p className="text-[var(--muted)] text-sm">
          Forgot your password? Click <strong>Forgot password?</strong> on the
          login page. Check your inbox and spam folder for the reset link.
        </p>
      </section>

      <section id="step-2" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 2 — The dashboard</h2>
        <p className="mb-3 text-[var(--foreground)]">
          Four sections in the left sidebar:
        </p>
        <ul className="space-y-3">
          <li className="border-l-2 border-indigo-600 pl-4">
            <strong>Overview</strong> — your most recent trades and AI activity
            at a glance.
          </li>
          <li className="border-l-2 border-indigo-600 pl-4">
            <strong>Portfolio</strong> — pick an exchange and place a paper
            trade.
          </li>
          <li className="border-l-2 border-indigo-600 pl-4">
            <strong>Journal</strong> — every trade and decision, with notes you
            can add.
          </li>
          <li className="border-l-2 border-indigo-600 pl-4">
            <strong>Agents</strong> — talk to the six AI agents directly.
          </li>
        </ul>
      </section>

      <section id="step-3" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">
          Step 3 — Place your first paper trade
        </h2>
        <ol className="space-y-3 list-decimal list-inside">
          <li>From the dashboard sidebar, click <strong>Portfolio</strong>.</li>
          <li>Choose an exchange. <strong>Alpaca</strong> for stocks (AAPL, MSFT, TSLA). <strong>Kraken</strong> for crypto (BTC, ETH, SOL).</li>
          <li>Type a symbol — for example, <code className="bg-[var(--card)] px-1.5 py-0.5 rounded">AAPL</code>.</li>
          <li>Enter a quantity — for stocks try <code className="bg-[var(--card)] px-1.5 py-0.5 rounded">1</code>. For crypto try <code className="bg-[var(--card)] px-1.5 py-0.5 rounded">0.01</code>.</li>
          <li>Choose <strong>Buy</strong> or <strong>Sell</strong>.</li>
          <li>Click <strong>Submit Paper Order</strong>.</li>
          <li>Look for the green confirmation. The trade appears in your Journal.</li>
        </ol>
        <div className="mt-6 bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-sm">
          <strong>Common error:</strong> &ldquo;Could not fetch price for X&rdquo;
          usually means the symbol doesn&apos;t exist on that exchange. Double
          check the spelling. AAPL not AAPLL. BTC not BITCOIN.
        </div>
      </section>

      <section id="step-4" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 4 — Run an AI agent</h2>
        <p className="mb-4 text-[var(--foreground)]">
          Click <strong>Agents</strong> in the sidebar. Pick one of the six.
          Type a prompt. Click run. The agent&apos;s output appears below.
        </p>
        <div className="space-y-3">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="font-semibold text-sm mb-1">Quant Agent</p>
            <p className="text-[var(--muted)] text-xs mb-2">Try: &ldquo;Analyse AAPL momentum and suggest a paper trade.&rdquo;</p>
            <p className="text-[var(--muted)] text-xs">Returns a structured proposal that&apos;s automatically passed to the Risk Agent for validation.</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="font-semibold text-sm mb-1">Risk Agent</p>
            <p className="text-[var(--muted)] text-xs mb-2">Try: &ldquo;Validate: BUY 50 AAPL at $185 against a $12,000 portfolio.&rdquo;</p>
            <p className="text-[var(--muted)] text-xs">Returns APPROVED or REJECTED with reasoning. Veto power.</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="font-semibold text-sm mb-1">Compliance Agent</p>
            <p className="text-[var(--muted)] text-xs mb-2">Try: &ldquo;Our system guarantees consistent returns.&rdquo;</p>
            <p className="text-[var(--muted)] text-xs">Flags regulated language and suggests compliant rewrites.</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="font-semibold text-sm mb-1">CEO / SEO / Support agents</p>
            <p className="text-[var(--muted)] text-xs">Briefings, blog drafts, and platform Q&amp;A respectively. Each has a dedicated guide page accessible from the home page.</p>
          </div>
        </div>
      </section>

      <section id="step-5" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 5 — Use the trade journal</h2>
        <p className="mb-3 text-[var(--foreground)]">
          Every trade and every agent run lands in the Journal automatically.
          Click any entry to expand it. Add your own notes — what you were
          thinking, what you learned, what you&apos;d do differently.
        </p>
        <p className="text-[var(--foreground)]">
          The Journal is append-only. Entries can&apos;t be edited or deleted.
          That&apos;s by design — your record stays trustworthy.
        </p>
      </section>

      <section id="step-6" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 6 — Risk limits explained</h2>
        <p className="mb-4 text-[var(--foreground)]">
          Hard limits enforced server-side on every order:
        </p>
        <table className="w-full text-sm border border-[var(--card-border)] rounded-xl overflow-hidden">
          <tbody>
            <tr className="border-b border-[var(--card-border)]">
              <td className="px-4 py-3 font-medium">Max position size</td>
              <td className="px-4 py-3 text-[var(--muted)]">$5,000 per trade</td>
            </tr>
            <tr className="border-b border-[var(--card-border)]">
              <td className="px-4 py-3 font-medium">Max daily loss</td>
              <td className="px-4 py-3 text-[var(--muted)]">$500 cumulative per day</td>
            </tr>
            <tr className="border-b border-[var(--card-border)]">
              <td className="px-4 py-3 font-medium">Max open positions</td>
              <td className="px-4 py-3 text-[var(--muted)]">10 simultaneously</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Stop-loss</td>
              <td className="px-4 py-3 text-[var(--muted)]">5% (mandatory)</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-[var(--muted)] text-sm">
          Hit one and the order is rejected with a clear reason. Limits reset
          daily at midnight UTC.
        </p>
      </section>

      <section id="step-7" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Step 7 — Switching exchanges</h2>
        <p className="text-[var(--foreground)]">
          On the Portfolio page you can pick Alpaca (stocks) or Kraken (crypto)
          on every order. Both run in paper mode. More exchanges (Coinbase,
          Binance, Bitget, KuCoin) are on the roadmap.
        </p>
      </section>

      <section id="troubleshooting" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">&ldquo;Could not fetch price for X&rdquo;</p>
            <p className="text-[var(--muted)] text-sm">Symbol typo or symbol not on that exchange. Try AAPL on Alpaca, BTC on Kraken.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">&ldquo;Invalid login credentials&rdquo;</p>
            <p className="text-[var(--muted)] text-sm">Check Caps Lock. Phones may autocorrect emails. Try desktop. Click &ldquo;Forgot password?&rdquo; on the login page.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">&ldquo;Daily loss limit reached&rdquo;</p>
            <p className="text-[var(--muted)] text-sm">You hit $500 paper losses today. Risk discipline. Resume tomorrow.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">Page won&apos;t load / spinner forever</p>
            <p className="text-[var(--muted)] text-sm">Hard refresh: Cmd+Shift+R (Mac), Ctrl+Shift+R (Windows). If still broken, sign out and back in.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">Rate limit error</p>
            <p className="text-[var(--muted)] text-sm">10 trades/min and 20 agent runs/5min per user. Wait the indicated time and retry.</p>
          </div>
        </div>
      </section>

      <section id="faq" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">FAQ</h2>
        <div className="space-y-4">
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">Can I lose real money?</p>
            <p className="text-[var(--muted)] text-sm">No. Paper trading only. Live trading is not enabled and requires legal review before activation.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">Is this financial advice?</p>
            <p className="text-[var(--muted)] text-sm">No. Research and education only. See <Link href="/legal" className="text-indigo-400 hover:underline">Legal &amp; Liability</Link>.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">Do AI agents actually work?</p>
            <p className="text-[var(--muted)] text-sm">They use Claude Sonnet to reason through your prompts. They can be wrong. Verify every output before acting.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">When does live trading open?</p>
            <p className="text-[var(--muted)] text-sm">Only after legal review and only with explicit user opt-in. No date set.</p>
          </div>
          <div className="border border-[var(--card-border)] rounded-xl p-5">
            <p className="font-semibold mb-2">How do I export my trades?</p>
            <p className="text-[var(--muted)] text-sm">CSV export is on the roadmap. For now screenshot the Journal page.</p>
          </div>
        </div>
      </section>

      <section className="mt-16 pt-12 border-t border-[var(--card-border)] text-center">
        <h2 className="text-2xl font-bold mb-4">Still stuck?</h2>
        <p className="text-[var(--muted)] mb-6">
          The Support Agent answers platform questions instantly.
        </p>
        <Link
          href="/dashboard/agents"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Ask the Support Agent
        </Link>
      </section>
    </div>
  );
}
