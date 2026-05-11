import type { Metadata } from "next";
import Link from "next/link";
import UpgradeButton from "./UpgradeButton";

export const metadata: Metadata = {
  title: "Pricing — Paper Trading Research Plans",
  description:
    "Elexa AI Trading pricing. Paper trading research tool plans. Not financial advice.",
};

type PricingPlan = {
  id: "free" | "researcher" | "pro";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
  hrefIfFree?: string;
};

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Explore the platform and run paper trades manually.",
    features: [
      "Paper trading dashboard",
      "5 AI agent runs / day",
      "Basic trade journal (30-day retention)",
      "Watchlist (5 symbols)",
      "Risk limit enforcement",
      "Community support",
    ],
    cta: "Get Started",
    hrefIfFree: "/dashboard",
    highlight: false,
  },
  {
    id: "researcher",
    name: "Researcher",
    price: "$29",
    period: "/ month",
    description: "Unlock AI agents and deeper signal analysis.",
    features: [
      "Everything in Free",
      "Unlimited agent runs",
      "3 paper portfolios",
      "1-year journal retention",
      "Watchlist (30 symbols)",
      "CSV trade export",
      "Email support",
    ],
    cta: "Start Researcher",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    period: "/ month",
    description: "Full platform access for serious traders.",
    features: [
      "Everything in Researcher",
      "Auto-Trade workflow (Quant → Risk → execute)",
      "Custom risk profiles per portfolio",
      "API access (read-only)",
      "Advanced agent orchestration",
      "Priority support",
      "Live trading (when activated)",
    ],
    cta: "Start Pro",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
          All plans include paper trading only. No real money is ever at risk on
          this platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 flex flex-col gap-6 ${
              plan.highlight
                ? "border-indigo-500 bg-indigo-950"
                : "border-[var(--card-border)] bg-[var(--card)]"
            }`}
          >
            {plan.highlight && (
              <span className="self-start text-xs font-semibold bg-indigo-600 text-white px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">{plan.name}</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-[var(--muted)] mb-1">{plan.period}</span>
              </div>
              <p className="text-[var(--muted)] text-sm mt-2">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.id === "free" ? (
              <Link
                href={plan.hrefIfFree ?? "/dashboard"}
                className={`text-center py-3 rounded-lg font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "border border-[var(--card-border)] hover:border-indigo-600 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            ) : (
              <UpgradeButton
                plan={plan.id}
                label={plan.cta}
                highlight={plan.highlight}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-amber-950 border border-amber-800 rounded-xl text-center">
        <p className="text-amber-300 text-sm">
          <strong>Reminder:</strong> Elexa AI Trading is a paper trading
          research tool only. No real securities are purchased. This is not
          financial advice, and no returns are guaranteed.{" "}
          <Link href="/disclaimer" className="underline hover:text-amber-200">
            Read full disclaimer
          </Link>
        </p>
      </div>
    </div>
  );
}
