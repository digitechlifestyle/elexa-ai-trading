import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backend Demo Test",
  description:
    "A no-JavaScript backend demo test form for Elexa AI Trading simulation checks.",
};

const exampleLinks = [
  {
    label: "Crypto backend test",
    href: "/api/demo/simulation?focus=crypto&symbols=BTC,ETH,XRP,RLUSD,SHX",
  },
  {
    label: "Stocks backend test",
    href: "/api/demo/simulation?focus=stocks&symbols=NVDA,MSFT,AAPL,MSTR,PLTR",
  },
  {
    label: "ETF backend test",
    href: "/api/demo/simulation?focus=etfs&symbols=SPY,QQQ,GLD,SLV,TLT",
  },
  {
    label: "Mixed backend test",
    href: "/api/demo/simulation?focus=mixed&symbols=BTC,RLUSD,NVDA,SPY,GLD,SHX",
  },
];

export default function DemoBackendPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <section className="text-center mb-12">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Backend demo test
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Test the backend without React buttons.
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto leading-relaxed">
          This page uses a normal browser form. It does not depend on client-side
          JavaScript, so it is the cleanest way to confirm the backend function works.
        </p>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Run backend simulation</h2>
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
              Symbols
            </label>
            <input
              id="symbols"
              name="symbols"
              defaultValue="BTC,ETH,XRP,RLUSD,SHX,NVDA,SPY"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm text-white"
            />
            <p className="text-[var(--muted)] text-xs mt-2">
              Separate symbols with commas. Example: BTC, ETH, XRP, RLUSD, SHX, MSTR.
            </p>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Submit Backend Test
          </button>
        </form>
      </section>

      <section className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">One-click backend tests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exampleLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="border border-indigo-700 hover:border-indigo-400 rounded-lg px-5 py-4 text-indigo-100 font-semibold transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
