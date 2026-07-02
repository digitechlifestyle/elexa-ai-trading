import type { Metadata } from "next";
import Link from "next/link";
import DemoClient from "./DemoClient";

export const metadata: Metadata = {
  title: "Try Demo Mode",
  description:
    "Try Elexa AI Trading in public demo mode without exchange keys, broker connections or real-money execution.",
};

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Public demo mode
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Test Elexa without logging in first.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          This no-login demo lets you choose a market focus, build a sample
          watchlist, preview AI research notes and run a safe simulated output.
          No exchange keys, broker connection or real-money execution are used.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Demo safety rule
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed">
          This demo is local to your browser. It is not financial advice, not a
          signal, not a broker connection and not a live trading system.
        </p>
      </section>

      <DemoClient />

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mt-12 text-center">
        <h2 className="text-2xl font-bold mb-3">Public pages to test next</h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto mb-6">
          These pages should open without login and explain the product clearly.
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
            Trust &amp; Safety
          </Link>
        </div>
      </section>
    </div>
  );
}
