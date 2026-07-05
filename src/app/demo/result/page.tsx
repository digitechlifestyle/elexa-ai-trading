import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo Result",
  description:
    "Formatted Elexa AI Trading demo simulation result with research plan, risk notes and next action.",
};

const allowedFocus = new Set(["crypto", "stocks", "etfs", "mixed"]);

type DemoSearchParams = {
  focus?: string | string[];
  symbols?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSymbols(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw
    .split(/[,\s]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.:-]{1,12}$/.test(symbol))
    .slice(0, 30);
}

function buildRiskNotes(focus: string, symbols: string[]) {
  const stablecoins = symbols.filter((symbol) =>
    ["USDT", "USDC", "RLUSD", "PYUSD", "FDUSD", "DAI", "USDE"].includes(symbol)
  );

  const notes = [
    "This is a demo simulation only. It is not financial advice and does not place trades.",
    "Use the result to organise research, not to decide whether to buy or sell.",
  ];

  if (focus === "crypto" || focus === "mixed") {
    notes.push("Crypto assets can be highly volatile and may lose most or all of their value.");
  }

  if (focus === "stocks" || focus === "mixed") {
    notes.push("Stocks can fall sharply around earnings, macro news, liquidity changes and sector rotation.");
  }

  if (focus === "etfs" || focus === "mixed") {
    notes.push("ETFs can still carry market, sector, commodity, bond or liquidity risk.");
  }

  if (stablecoins.length > 0) {
    notes.push(
      `Stablecoin watchlist item(s) detected: ${stablecoins.join(", ")}. Stablecoins can still carry issuer, reserve, liquidity, regulatory and de-peg risk.`
    );
  }

  return notes;
}

export default async function DemoResultPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const params = await searchParams;
  const focusInput = firstValue(params.focus);
  const focus = allowedFocus.has(String(focusInput)) ? String(focusInput) : "mixed";
  const symbols = parseSymbols(params.symbols);
  const primarySymbol = symbols[0] ?? "No symbol selected";
  const riskNotes = buildRiskNotes(focus, symbols);
  const generatedAt = new Date().toISOString();

  if (symbols.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-100 mb-4">
            Add at least one valid symbol
          </h1>
          <p className="text-amber-300 mb-6">
            The demo needs one or more symbols before it can generate a research result.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Demo
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-12">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Demo simulation result
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Research preview for {primarySymbol}
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          Demo simulation complete for {symbols.length} watchlist symbol
          {symbols.length === 1 ? "" : "s"}. This is a research and risk review
          output only — not a trading signal or financial advice.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Focus</p>
          <p className="text-2xl font-bold capitalize">{focus}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Primary symbol</p>
          <p className="text-2xl font-bold">{primarySymbol}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
          <p className="text-[var(--muted)] text-sm mb-2">Symbols reviewed</p>
          <p className="text-2xl font-bold">{symbols.length}</p>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Watchlist</h2>
        <div className="flex flex-wrap gap-2">
          {symbols.map((symbol) => (
            <span
              key={symbol}
              className="text-sm bg-indigo-950 border border-indigo-800 rounded-full px-4 py-2 text-indigo-200"
            >
              {symbol}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Research plan</h2>
          <div className="space-y-3 text-indigo-200 text-sm leading-relaxed">
            <p>• Review market context and recent catalysts.</p>
            <p>• Check volatility, liquidity and concentration risk.</p>
            <p>• Compare the idea against the rest of the watchlist.</p>
            <p>• Record the reason for the idea in a journal before taking any real-world action elsewhere.</p>
          </div>
        </div>

        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-amber-100 mb-4">Risk notes</h2>
          <div className="space-y-3 text-amber-300 text-sm leading-relaxed">
            {riskNotes.map((note) => (
              <p key={note}>• {note}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">Next action</h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
          Continue research in demo mode. Do not connect real funds or use
          withdrawal-enabled API keys. Use this result to organise your research,
          compare risks and write a journal note before making any real-world
          decision outside Elexa.
        </p>
        <p className="text-[var(--muted)] text-xs">Generated at: {generatedAt}</p>
      </section>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/demo"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Run Another Demo
        </Link>
        <Link
          href="/reports/buffett-indicator"
          className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          View Buffett Indicator
        </Link>
        <Link
          href="/tool-stack"
          className="border border-[var(--card-border)] hover:border-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          View Tool Stack
        </Link>
      </div>
    </div>
  );
}
