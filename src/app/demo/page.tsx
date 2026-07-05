import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Try Demo Mode",
  description:
    "Try Elexa AI Trading in backend-first demo mode without exchange keys, broker connections or real-money execution.",
};

const exampleTests = [
  {
    label: "Crypto demo",
    href: "/api/demo/simulation?focus=crypto&symbols=BTC,ETH,XRP,RLUSD,SHX",
  },
  {
    label: "Stocks demo",
    href: "/api/demo/simulation?focus=stocks&symbols=NVDA,MSFT,AAPL,MSTR,PLTR",
  },
  {
    label: "ETF demo",
    href: "/api/demo/simulation?focus=etfs&symbols=SPY,QQQ,GLD,SLV,TLT",
  },
  {
    label: "Mixed demo",
    href: "/api/demo/simulation?focus=mixed&symbols=BTC,RLUSD,NVDA,SPY,GLD,SHX",
  },
];

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Backend-first demo mode
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Test Elexa without login or broken buttons.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          This demo uses a normal browser form that submits directly to the
          backend simulation API. It does not rely on client-side React state, so
          it is safer for preview testing on mobile, desktop and private browser windows.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Demo safety rule
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed">
          This is a backend demo simulation only. It is not financial advice, not
          a trading signal, not a broker connection and not a live trading system.
          No exchange keys, broker connection or real-money execution are used.
        </p>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">Run backend demo simulation</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
          Type the symbols you want to test, separated by commas, then submit.
          The response will come from the backend API as JSON so we can confirm
          the server function is working.
        </p>

        <form action="/api/demo/simulation" method="get" className="space-y-5">
          <div>
            <label htmlFor="focus" className="block text-sm font-semibold mb-2">
              Market focus
            </label>
            <select
              id="focus"
              name="focus"
              defaultValue="mixed"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm text-white"
            >
              <option value="mixed">Mixed markets</option>
              <option value="crypto">Crypto and stablecoins</option>
              <option value="stocks">Stocks</option>
              <option value="etfs">ETFs</option>
            </select>
          </div>

          <div>
            <label htmlFor="symbols" className="block text-sm font-semibold mb-2">
              Symbols to test
            </label>
            <input
              id="symbols"
              name="symbols"
              defaultValue="BTC,ETH,XRP,RLUSD,SHX,NVDA,SPY"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm text-white"
            />
            <p className="text-[var(--muted)] text-xs mt-2">
              Example: BTC, ETH, XRP, RLUSD, SHX, MSTR, NVDA, SPY.
            </p>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Submit Backend Demo
          </button>
        </form>
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">One-click backend tests</h2>
        <p className="text-indigo-200 text-sm leading-relaxed mb-6">
          These links test the same backend function without typing anything.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exampleTests.map((test) => (
            <a
              key={test.href}
              href={test.href}
              className="border border-indigo-700 hover:border-indigo-400 rounded-lg px-5 py-4 text-indigo-100 font-semibold transition-colors"
            >
              {test.label}
            </a>
          ))}
        </div>
      </section>

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
          <Link href="/tool-stack" className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Tool Stack
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
