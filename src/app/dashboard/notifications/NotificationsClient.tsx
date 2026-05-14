"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  kind: "trade" | "agent" | "info";
  title: string;
  body: string;
  created_at: string;
  href?: string;
}

const KIND_ICON: Record<string, string> = {
  trade: "💼", agent: "🤖", info: "ℹ️",
};
const KIND_COLOR: Record<string, string> = {
  trade: "border-indigo-700 bg-indigo-950/30",
  agent: "border-purple-700 bg-purple-950/30",
  info: "border-amber-700 bg-amber-950/30",
};

export default function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState<"all" | "trade" | "agent" | "info">("all");

  async function load() {
    setLoading(true); setErr(null);
    try {
      const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
      const res = await fetch(`/api/notifications?since=${encodeURIComponent(since)}`);
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else setItems(j.notifications ?? []);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  async function markRead() {
    await fetch("/api/notifications", { method: "POST" });
    // refresh bell badge — page reload not needed, parent bell polls
  }

  useEffect(() => { load(); }, [days]);
  useEffect(() => { markRead(); }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">🔔 Notifications</h1>
          <p className="text-[var(--muted)] text-sm">
            Trades, agent runs, system updates.
          </p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm">
          <option value={7}>7 days</option><option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="flex gap-1 border-b border-[var(--card-border)]">
        {(["all", "trade", "agent", "info"] as const).map((f) => {
          const count = f === "all" ? items.length : items.filter((i) => i.kind === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f ? "border-b-2 border-indigo-500 text-white" : "text-[var(--muted)] hover:text-white"
              }`}>
              {f === "all" ? "All" : KIND_ICON[f] + " " + f} ({count})
            </button>
          );
        })}
      </div>

      {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
      {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center text-sm text-[var(--muted)]">
          No notifications in this window.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((n) => {
          const time = new Date(n.created_at);
          const body = (
            <div className={`border ${KIND_COLOR[n.kind]} rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{KIND_ICON[n.kind]}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-xs text-[var(--muted)]">{time.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">{n.body}</p>
                </div>
              </div>
            </div>
          );
          return n.href ? (
            <Link key={n.id} href={n.href} className="block hover:opacity-80 transition-opacity">{body}</Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}
