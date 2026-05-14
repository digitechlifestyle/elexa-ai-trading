"use client";

import { useEffect, useState } from "react";

interface Event { time: string; kind: string; title: string; detail: string; }

const ICON: Record<string, string> = {
  trade: "💼", agent: "🤖", journal: "📓", alert: "🔔",
};

export default function AuditClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/audit-log");
        const j = await res.json();
        if (!res.ok) setErr(j.error ?? "Failed");
        else setEvents(j.events ?? []);
      } catch { setErr("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading audit log…</div>;
  if (err) return <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>;

  const kinds = Array.from(new Set(events.map((e) => e.kind)));
  const filtered = filter === "all" ? events : events.filter((e) => e.kind === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📜 Audit Log</h1>
        <p className="text-[var(--muted)] text-sm">
          Last 60 days of trade, agent, and journal activity. Newest first.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)] flex-wrap">
        {(["all", ...kinds] as string[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              filter === k ? "border-b-2 border-indigo-500 text-white" : "text-[var(--muted)] hover:text-white"
            }`}>
            {k === "all" ? `All (${events.length})` : `${ICON[k] ?? ""} ${k} (${events.filter((e) => e.kind === k).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map((e, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-3 flex items-start gap-3">
            <span className="text-xl">{ICON[e.kind] ?? "•"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-3 flex-wrap">
                <p className="font-semibold text-sm">{e.title}</p>
                <p className="text-xs text-[var(--muted)] font-mono">{new Date(e.time).toLocaleString()}</p>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{e.detail}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 text-sm text-[var(--muted)] text-center">
            No events.
          </div>
        )}
      </div>
    </div>
  );
}
