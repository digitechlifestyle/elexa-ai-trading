"use client";

import { useState } from "react";

export default function DemoClient() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function seed() {
    if (!confirm("Add 30 demo trades + journal entries to populate dashboards? Skipped if you already have > 5 trades.")) return;
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setMsg(`Seeded ${j.trades_inserted} trades + ${j.journal_inserted} journal entries.`);
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  async function clear() {
    if (!confirm("Delete demo journal entries (tagged 'demo')? Trades not touched.")) return;
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await fetch("/api/seed-demo", { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setMsg(j.note ?? "Cleared.");
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">🎮 Demo Data</h1>
        <p className="text-[var(--muted)] text-sm">
          Populate your dashboard with sample paper trades + journal entries so you can see analytics, trade stats, equity curve, and AI summaries in action.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Seed demo data</h2>
          <p className="text-xs text-[var(--muted)] mb-3">
            Adds 30 buy/sell trade pairs across AAPL, MSFT, NVDA, TSLA, SPY, QQQ, BTC, ETH spread across last 60 days. Plus ~8 journal entries.
          </p>
          <button onClick={seed} disabled={busy}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {busy ? "Working…" : "Seed demo data"}
          </button>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4">
          <h2 className="font-semibold mb-1">Clear demo journal</h2>
          <p className="text-xs text-[var(--muted)] mb-3">
            Removes journal entries tagged <code className="font-mono">demo</code>. Trades stay (no demo tag on schema).
          </p>
          <button onClick={clear} disabled={busy}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
            {busy ? "Working…" : "Clear demo journal"}
          </button>
        </div>
      </div>

      {msg && <div className="bg-green-950 border border-green-700 text-green-300 text-sm rounded-lg px-3 py-2">{msg}</div>}
      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Demo trades are inserted as <code className="font-mono">filled</code> with synthetic prices. Don&apos;t mix with real trade analysis without segregating.
      </div>
    </div>
  );
}
