"use client";

import { useState } from "react";

interface Idea {
  symbol: string; direction: string; conviction: string;
  entry: string; stop: string; target: string; thesis: string;
}

const CONV_COLOR: Record<string, string> = {
  high: "bg-green-600 text-white",
  medium: "bg-amber-500 text-black",
  low: "bg-gray-600 text-white",
};

export default function TradeIdeasClient() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [generated, setGenerated] = useState<string>("");

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/trade-ideas", { method: "POST" });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setIdeas([]); }
      else { setIdeas(j.ideas ?? []); setGenerated(j.generated_at); }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">💡 AI Trade Ideas</h1>
        <p className="text-[var(--muted)] text-sm">
          Claude scans 20+ symbols and picks top 3 setups with entry/stop/target.
        </p>
      </div>

      <button onClick={run} disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
        {loading ? "Claude is scanning the tape…" : "Generate trade ideas"}
      </button>

      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {generated && (
        <p className="text-xs text-[var(--muted)]">Generated {new Date(generated).toLocaleString()}</p>
      )}

      <div className="space-y-3">
        {ideas.map((i, idx) => (
          <div key={idx} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xl">{i.symbol}</span>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  i.direction === "long" ? "bg-green-700 text-white" : "bg-red-700 text-white"
                }`}>{i.direction}</span>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${CONV_COLOR[i.conviction] || "bg-gray-600 text-white"}`}>
                  {i.conviction}
                </span>
              </div>
            </div>

            <p className="text-sm mb-3 text-[var(--muted)]">{i.thesis}</p>

            <div className="grid sm:grid-cols-3 gap-2 text-xs">
              <Field label="Entry" value={i.entry} color="text-indigo-300" />
              <Field label="Stop" value={i.stop} color="text-red-300" />
              <Field label="Target" value={i.target} color="text-green-300" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ AI ideas are not financial advice. Size positions per your own risk plan. Paper-test first. Research only.
      </div>
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded p-2">
      <p className="text-[var(--muted)] font-semibold mb-1">{label}</p>
      <p className={`${color} font-mono`}>{value}</p>
    </div>
  );
}
