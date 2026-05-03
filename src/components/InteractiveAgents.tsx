"use client";

import { useState } from "react";

const agents = [
  {
    name: "CEO Agent",
    role: "Delegates tasks, summarises board briefings",
    details: "Orchestrates the entire AI team, making high-level strategic decisions. Reviews all trade proposals, synthesizes team recommendations, and provides executive summaries. Cannot execute trades unilaterally — all decisions require Risk Agent validation.",
    color: "indigo",
  },
  {
    name: "Quant Agent",
    role: "Analyses signals, proposes trade ideas",
    details: "Analyzes market data, technical indicators, and historical patterns. Identifies trading opportunities based on quantitative research. Proposes trades with reasoning and expected outcomes. Passes all proposals to Risk Agent for validation.",
    color: "violet",
  },
  {
    name: "Risk Agent",
    role: "Validates against stop-loss and position limits",
    details: "Enforces hard risk limits: max position size $5,000, max daily loss $500, max open positions 10, stop-loss 5%. Validates every trade before execution. Can reject trades that violate risk parameters. Server-side enforcement — no override possible.",
    color: "rose",
  },
  {
    name: "Compliance Agent",
    role: "Flags regulated language and legal risks",
    details: "Scans all content and communications for regulated language. Flags phrases like 'guaranteed profit', 'risk-free', or other misleading claims. Ensures all user-facing content complies with SEC, FINRA, and CFTC guidelines. Educational focus only.",
    color: "amber",
  },
  {
    name: "SEO Agent",
    role: "Generates compliant blog and keyword content",
    details: "Creates educational blog posts and content around trading research. Generates SEO-optimized articles that teach trading concepts without making financial predictions. All content reviewed by Compliance Agent before publication.",
    color: "emerald",
  },
  {
    name: "Support Agent",
    role: "Answers user questions about the platform",
    details: "Provides 24/7 user support on platform features, paper trading mechanics, risk management, and account issues. Does not provide investment advice — redirects financial questions to qualified advisors. Logs all interactions for compliance audit trail.",
    color: "sky",
  },
];

export default function InteractiveAgents() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl font-bold text-center mb-4">The Agent Team</h2>
      <p className="text-center text-[var(--muted)] mb-12 max-w-xl mx-auto">
        Every trade idea passes through multiple AI checkpoints. No single agent
        has unilateral authority. Click any agent to learn more.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.name}
            onClick={() =>
              setExpanded(expanded === agent.name ? null : agent.name)
            }
            className={`text-left border rounded-xl p-5 bg-[var(--card)] transition-all hover:border-${agent.color}-600 cursor-pointer ${
              expanded === agent.name
                ? `border-${agent.color}-600 ring-2 ring-${agent.color}-600 ring-opacity-50`
                : "border-[var(--card-border)]"
            }`}
          >
            <p className={`font-semibold text-sm mb-1 text-${agent.color}-400`}>
              {agent.name}
            </p>
            <p className="text-[var(--muted)] text-xs mb-3">{agent.role}</p>
            {expanded === agent.name && (
              <div className="mt-4 pt-4 border-t border-[var(--card-border)] text-xs text-[var(--muted)] leading-relaxed">
                {agent.details}
              </div>
            )}
            <p className="text-xs text-indigo-400 mt-2">
              {expanded === agent.name ? "Click to collapse ↑" : "Click to expand ↓"}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
