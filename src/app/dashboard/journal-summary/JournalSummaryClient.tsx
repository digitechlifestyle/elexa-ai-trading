"use client";

import { useState } from "react";

export default function JournalSummaryClient() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [count, setCount] = useState(0);
  const [generated, setGenerated] = useState<string>("");

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/journal-summary", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        setSummary("");
      } else {
        setSummary(j.summary);
        setCount(j.entry_count);
        setGenerated(j.generated_at);
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
        <h1 className="text-2xl font-bold mb-1">🧠 AI Journal Summary</h1>
        <p className="text-[var(--muted)] text-sm">
          Claude reads your last 30 days of journal entries and surfaces
          recurring themes, mistakes, and three actions for next week.
        </p>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
      >
        {loading ? "Analysing…" : "Generate summary"}
      </button>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {summary && (
        <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
          <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
            <h2 className="font-semibold">📓 Coach review ({count} entries)</h2>
            <span className="text-xs text-indigo-300">
              {new Date(generated).toLocaleString()}
            </span>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-100 font-sans">
            {summary}
          </pre>
        </div>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Research only — not financial advice or psychiatric advice. Coach review reflects patterns in your own writing.
      </div>
    </div>
  );
}
