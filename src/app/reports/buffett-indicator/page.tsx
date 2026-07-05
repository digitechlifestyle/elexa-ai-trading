import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buffett Indicator Report",
  description:
    "A plain-English macro valuation report explaining the Buffett Indicator for Elexa AI Trading users.",
};

const interpretationBands = [
  {
    label: "Normal",
    range: "Below long-term average",
    meaning:
      "Broad market valuation may be less stretched, but this does not automatically mean markets are cheap or safe.",
  },
  {
    label: "Elevated",
    range: "Above long-term average",
    meaning:
      "Investors should be more careful with valuation, concentration and optimism-driven narratives.",
  },
  {
    label: "Stretched",
    range: "Far above long-term average",
    meaning:
      "Broad market risk may be higher. Future returns can be more sensitive to earnings, rates and liquidity changes.",
  },
  {
    label: "Extreme",
    range: "Historically high zone",
    meaning:
      "Use strong caution. This is a macro warning layer, not a precise crash timer or short signal.",
  },
];

const reportChecklist = [
  "Compare total stock market value with GDP.",
  "Check whether the reading is normal, elevated, stretched or extreme.",
  "Review interest rates, inflation, earnings, liquidity and market concentration.",
  "Explain what the reading means in plain English.",
  "Warn users that the indicator is not a buy, sell or short signal.",
  "Encourage watchlist review, risk sizing and journaling before any real-world decision outside Elexa.",
];

export default function BuffettIndicatorPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <section className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Macro report module
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">
          Buffett Indicator Report
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-3xl mx-auto leading-relaxed">
          The Buffett Indicator compares broad stock market value with the size
          of the economy. Elexa uses it as a valuation temperature gauge — not as
          a prediction, signal or instruction to buy, sell or short.
        </p>
      </section>

      <section className="bg-amber-950 border border-amber-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-amber-100 mb-3">
          Important warning
        </h2>
        <p className="text-amber-300 text-sm leading-relaxed">
          A high Buffett Indicator reading does not guarantee a crash, and a low
          reading does not guarantee profits. It can stay elevated for long
          periods. This report is for education, research and risk context only.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Formula</h2>
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-5 mb-5">
            <p className="text-xl font-bold text-white">
              Total Stock Market Value ÷ GDP × 100
            </p>
          </div>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            The higher the ratio, the more expensive the broad stock market may
            be relative to the economy. Elexa should combine this with other
            macro inputs before giving any research summary.
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Elexa use case</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
            Use this module before users research stocks, ETFs, AI market themes
            or broad risk-on/risk-off conditions. It should help users ask better
            questions, not make automatic trading decisions.
          </p>
          <div className="space-y-2 text-sm text-[var(--muted)]">
            <p>• Macro valuation context</p>
            <p>• Risk regime explanation</p>
            <p>• Stock and ETF caution layer</p>
            <p>• Journal prompt for user discipline</p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Interpretation bands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interpretationBands.map((band) => (
            <div
              key={band.label}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-5"
            >
              <h3 className="font-bold text-lg mb-1">{band.label}</h3>
              <p className="text-indigo-300 text-sm mb-3">{band.range}</p>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {band.meaning}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Report checklist</h2>
          <div className="space-y-3 text-indigo-200 text-sm leading-relaxed">
            {reportChecklist.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Next build step</h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
            The current page defines the report structure. The next development
            step is to connect a reliable data source and calculate the live or
            regularly updated reading.
          </p>
          <div className="space-y-2 text-sm text-[var(--muted)]">
            <p>1. Add data source for total market value.</p>
            <p>2. Add data source for GDP.</p>
            <p>3. Calculate ratio.</p>
            <p>4. Store reading history.</p>
            <p>5. Generate plain-English report summary.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
