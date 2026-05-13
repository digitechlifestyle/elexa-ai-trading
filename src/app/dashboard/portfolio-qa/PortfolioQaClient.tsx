"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's my biggest risk right now?",
  "Am I too concentrated?",
  "Which position has the most upside?",
  "What sectors am I missing?",
  "How should I think about rebalancing?",
];

export default function PortfolioQaClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/portfolio-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: j.answer }]);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">💬 Portfolio Q&amp;A</h1>
        <p className="text-[var(--muted)] text-sm">
          Ask CEO Agent anything about <strong>your</strong> portfolio. It has
          access to your current positions and trade history.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 space-y-3 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted)] text-sm mb-4">
              Try one of these:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  disabled={loading}
                  className="text-xs bg-[var(--background)] border border-[var(--card-border)] hover:border-indigo-600 px-3 py-1.5 rounded"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--background)] border border-[var(--card-border)]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-sm">
              <span className="animate-pulse">●●●</span>
            </div>
          </div>
        )}
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your portfolio…"
          disabled={loading}
          className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
        >
          Ask
        </button>
      </form>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ CEO Agent uses your portfolio data to answer. Research only — not
        financial advice. Verify any actionable suggestion before trading.
      </div>
    </div>
  );
}
