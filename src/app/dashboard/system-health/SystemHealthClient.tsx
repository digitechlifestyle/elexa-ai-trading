"use client";

import { useEffect, useState } from "react";

interface Check { name: string; ok: boolean; detail?: string; }

export default function SystemHealthClient() {
  const [data, setData] = useState<{ ok: boolean; checks: Check[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/system-health");
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setData(j);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">🩺 System Health</h1>
          <p className="text-[var(--muted)] text-sm">
            Env vars + integrations status. Run before live trading.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          {loading ? "Checking…" : "Re-run"}
        </button>
      </div>

      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {data && (
        <>
          <div className={`rounded-xl p-6 text-center ${data.ok ? "bg-green-950 border border-green-700" : "bg-red-950 border border-red-700"}`}>
            <p className="text-3xl font-bold">{data.ok ? "✅ All systems go" : "❌ Issues detected"}</p>
            <p className="text-sm mt-2 text-[var(--muted)]">
              {data.checks.filter((c) => c.ok).length}/{data.checks.length} checks passed
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <ul className="space-y-1">
              {data.checks.map((c) => (
                <li key={c.name}
                  className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)] last:border-0">
                  <span className="font-mono">{c.name}</span>
                  <span className="flex items-center gap-2">
                    {c.detail && <span className="text-xs text-[var(--muted)]">{c.detail}</span>}
                    <span className={c.ok ? "text-green-400" : "text-red-400"}>{c.ok ? "✅" : "❌"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Failed env vars block features. Fix in Vercel → Settings → Environment Variables, then redeploy.
      </div>
    </div>
  );
}
