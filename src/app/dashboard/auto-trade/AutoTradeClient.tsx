"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TradePlan {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  entry: number | null;
  stop: number | null;
  target: number | null;
  confidence: "low" | "medium" | "high" | null;
  reasoning: string;
}

interface ProposalResult {
  plan: TradePlan | null;
  quant_output: string;
  risk_output: string | null;
  risk_approved?: boolean;
  error_parse?: string;
}

export default function AutoTradePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execMsg, setExecMsg] = useState<string | null>(null);

  async function runProposal() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setExecMsg(null);
    try {
      const res = await fetch("/api/agents/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function executeTrade() {
    if (!result?.plan) return;
    if (!confirm(`Execute paper ${result.plan.side} of ${result.plan.qty} ${result.plan.symbol}?`)) return;
    setExecuting(true);
    setExecMsg(null);
    try {
      const res = await fetch("/api/trading/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "alpaca",
          symbol: result.plan.symbol,
          qty: result.plan.qty,
          side: result.plan.side,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExecMsg(`❌ ${data.error}`);
      } else {
        setExecMsg(`✓ Paper ${result.plan.side} of ${result.plan.qty} ${result.plan.symbol} submitted.`);
        router.refresh();
      }
    } catch {
      setExecMsg("Network error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Auto Trade</h1>
        <p className="text-[var(--muted)] text-sm">
          Describe an idea. Quant Agent proposes. Risk Agent validates. You
          decide to execute or discard.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <label className="block text-sm font-medium">
          What do you want to trade?
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder='e.g. "Find a momentum long in tech under $200" or "Short BTC if it loses $80k"'
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-600"
        />
        <button
          onClick={runProposal}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {loading ? "Running Quant → Risk pipeline…" : "Generate Proposal"}
        </button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result?.error_parse && (
        <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-sm">
          {result.error_parse}
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-amber-300">Show raw Quant output</summary>
            <pre className="mt-2 whitespace-pre-wrap text-[var(--muted)]">{result.quant_output}</pre>
          </details>
        </div>
      )}

      {result?.plan && (
        <>
          {/* Proposal card */}
          <div className="bg-[var(--card)] border border-indigo-700 rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Proposed Trade</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <KV label="Symbol" value={result.plan.symbol} bold />
              <KV
                label="Side"
                value={result.plan.side.toUpperCase()}
                tone={result.plan.side === "buy" ? "good" : "bad"}
              />
              <KV label="Qty" value={String(result.plan.qty)} />
              <KV
                label="Confidence"
                value={result.plan.confidence ?? "—"}
              />
              <KV
                label="Entry"
                value={result.plan.entry != null ? `$${result.plan.entry}` : "—"}
              />
              <KV
                label="Stop"
                value={result.plan.stop != null ? `$${result.plan.stop}` : "—"}
              />
              <KV
                label="Target"
                value={result.plan.target != null ? `$${result.plan.target}` : "—"}
              />
              <KV
                label="R:R"
                value={
                  result.plan.entry != null &&
                  result.plan.stop != null &&
                  result.plan.target != null
                    ? `${(
                        Math.abs(result.plan.target - result.plan.entry) /
                        Math.abs(result.plan.entry - result.plan.stop)
                      ).toFixed(2)}:1`
                    : "—"
                }
              />
            </div>
            <p className="text-sm text-[var(--muted)] mt-5 leading-relaxed">
              {result.plan.reasoning}
            </p>
          </div>

          {/* Risk verdict */}
          <div
            className={`rounded-xl p-6 border ${
              result.risk_approved
                ? "bg-green-950 border-green-700"
                : "bg-red-950 border-red-700"
            }`}
          >
            <h2 className="font-semibold mb-3">
              {result.risk_approved ? "✓ Risk Agent Approved" : "✗ Risk Agent Rejected"}
            </h2>
            <pre className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
              {result.risk_output}
            </pre>
          </div>

          {/* Execute */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">
                {result.risk_approved
                  ? "Execute this trade in paper mode?"
                  : "Override risk veto and execute anyway?"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Order will be sent to Alpaca paper API. Hard limits still apply server-side.
              </p>
            </div>
            <button
              onClick={executeTrade}
              disabled={executing}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                result.risk_approved
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-amber-700 hover:bg-amber-600 text-white"
              } disabled:opacity-50`}
            >
              {executing
                ? "Executing…"
                : result.risk_approved
                ? "Execute Trade"
                : "Execute (override)"}
            </button>
          </div>

          {execMsg && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                execMsg.startsWith("✓")
                  ? "bg-green-950 border border-green-800 text-green-300"
                  : "bg-red-950 border border-red-800 text-red-300"
              }`}
            >
              {execMsg}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KV({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
  bold?: boolean;
}) {
  const color =
    tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "";
  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-0.5">{label}</p>
      <p className={`${bold ? "font-bold" : ""} ${color}`}>{value}</p>
    </div>
  );
}
