import type { Metadata } from "next";
import Link from "next/link";
import UpgradeButton from "./UpgradeButton";

export const metadata: Metadata = {
  title: "Pricing — AI Research, Risk Tools & Strategy Simulation Plans",
  description:
    "Elexa AI Trading pricing for AI market research, risk management, journaling and simulated strategy testing. Not financial advice.",
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
    description: "Start with the dashboard, watchlist and basic simulated research workflow.",
    features: [
      "Research dashboard access",
      "Basic market watchlist",
      "Limited AI research runs",
      "Simulated paper portfolio",
      "Basic trade journal",
      "Core risk reminders",
      "Education-first disclaimer prompts",
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
    description: "For users who want deeper AI research, scanners, journaling and exports.",
    features: [
      "Everything in Free",
      "Expanded AI research runs",
      "Market scanners and watchlist tools",
      "Multiple simulated portfolios",
      "Extended journal retention",
      "CSV exports for review",
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
    description: "Advanced research workflow for serious learners, analysts and power users.",
    features: [
      "Everything in Researcher",
      "Advanced strategy simulation",
      "Custom risk profiles per portfolio",
      "Advanced agent orchestration",
      "Portfolio health and review tools",
      "Priority support",
      "Roadmap access to future integrations",
    ],
    cta: "Start Pro",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="text-indigo-400 text-sm font-semibold mb-3">
          Launch-mode pricing
        </p>
        <h1 className="text-4xl font-bold mb-4">
          Research, risk tools and strategy simulation plans
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
          Elexa is priced as an AI research and simulated strategy-testing
          platform. It does not provide financial advice, guaranteed returns or
          live real-money execution at launch.
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
                Best for launch users
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
        <p className="text-amber-300 text-sm leading-relaxed">
          <strong>Important:</strong> Elexa is a research, education,
          journaling and simulation platform. It is not a broker, adviser,
          signal service or guarantee of profit. No real securities or crypto
          assets are purchased through launch-mode simulation.{" "}
          <Link href="/disclaimer" className="underline hover:text-amber-200">
            Read full disclaimer
          </Link>
        </p>
      </div>
    </div>
  );
}
