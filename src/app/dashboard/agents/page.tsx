"use client";

import { useState } from "react";
import type { AgentName } from "@/types";

const AGENTS: { name: AgentName; label: string; description: string; placeholder: string }[] = [
  { name: "quant", label: "Quant Agent", description: "Analyse a symbol or strategy idea", placeholder: "Analyse AAPL momentum over the past month and suggest a paper trade approach." },
  { name: "risk", label: "Risk Agent", description: "Validate a trade proposal against risk limits", placeholder: "Proposed paper trade: BUY 50 shares AAPL at $185. Daily portfolio: $12,000." },
  { name: "ceo", label: "CEO Agent", description: "Generate a weekly board briefing", placeholder: "Summarise this week: 3 AAPL paper trades, quant proposed MSFT long, risk rejected TSLA." },
  { name: "compliance", label: "Compliance Agent", description: "Check content for regulatory issues", placeholder: "Our AI agent guarantees consistent returns in any market condition." },
  { name: "seo", label: "SEO Agent", description: "Generate an educational blog post", placeholder: "What is algorithmic trading and how does it work?" },
  { name: "support", label: "Support Agent", description: "Answer a user question about the platform", placeholder: "How do I place a paper trade?" },
];

export default function AgentsPage() {
  const [selected, setSelected] = useState<AgentName>("quant");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = AGENTS.find((a) => a.name === selected)!;

  async function runAgent() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput(null);
    setError(null);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: selected, input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Agent run failed");
      } else {
        setOutput(data.run.output);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI Agents</h1>
        <p className="text-[var(--muted)] text-sm">
          Trigger individual agents and review their output. All decisions are logged.
        </p>
      </div>

      {/* Agent selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {AGENTS.map((a) => (
          <button
            key={a.name}
            onClick={() => { setSelected(a.name); setOutput(null); setError(null); setInput(""); }}
            className={`text-left p-4 rounded-xl border transition-colors ${
              selected === a.name
                ? "border-indigo-500 bg-indigo-950"
                : "border-[var(--card-border)] bg-[var(--card)] hover:border-indigo-700"
            }`}
          >
            <p className="font-semibold text-sm">{a.label}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{a.description}</p>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-3">{current.label}</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder={current.placeholder}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-600"
        />
        <button
          onClick={runAgent}
          disabled={loading || !input.trim()}
          className="mt-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {loading ? "Running…" : `Run ${current.label}`}
        </button>
      </div>

      {/* Output */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}
      {output && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="font-semibold mb-3 text-sm text-[var(--muted)]">
            Agent Output
          </h3>
          <pre className="text-sm whitespace-pre-wrap break-words text-[var(--foreground)]">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
