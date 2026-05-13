"use client";

import { useEffect, useState } from "react";

interface Hook {
  id: string;
  label: string;
  url: string;
  events: string[];
  created_at: string;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
}

const EVENTS = [
  { id: "trade.filled", label: "Trade filled" },
  { id: "trade.submitted", label: "Trade submitted" },
  { id: "alert.triggered", label: "Alert triggered" },
  { id: "agent.run", label: "Agent run" },
];

export default function WebhooksClient() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["trade.filled"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/webhooks");
    if (res.ok) {
      const j = await res.json();
      setHooks(j.hooks ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url, events }),
      });
      const j = await res.json();
      if (!res.ok) setErr(j.error ?? "Failed");
      else {
        setLabel("");
        setUrl("");
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove webhook?")) return;
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    load();
  }

  function toggleEvent(ev: string) {
    setEvents(events.includes(ev) ? events.filter((e) => e !== ev) : [...events, ev]);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">📡 Outgoing Webhooks</h1>
        <p className="text-[var(--muted)] text-sm">
          Get notified in Discord, Slack, or your own service when events
          happen. Auto-detects Discord/Slack payload format.
        </p>
      </div>

      <form
        onSubmit={add}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm mb-1.5">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My Discord channel"
            maxLength={50}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Webhook URL (HTTPS only)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            type="url"
            required
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            In Discord: Edit channel → Integrations → Webhooks → New webhook → Copy URL.
            In Slack: app.slack.com → Incoming webhooks → Add to workspace.
          </p>
        </div>
        <div>
          <label className="block text-sm mb-1.5">Events to send</label>
          <div className="flex flex-wrap gap-2">
            {EVENTS.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(e.id)}
                  onChange={() => toggleEvent(e.id)}
                />
                <span>{e.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !url}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {busy ? "Adding…" : "Add Webhook"}
        </button>
        {err && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </form>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Active webhooks ({hooks.length}/5)</h2>
        {hooks.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No webhooks configured.</p>
        ) : (
          <ul className="space-y-3">
            {hooks.map((h) => (
              <li
                key={h.id}
                className="border-b border-[var(--card-border)] last:border-0 py-3"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{h.label}</p>
                    <p className="text-xs text-[var(--muted)] font-mono truncate">
                      {h.url}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Events: {h.events.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(h.id)}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 text-amber-200 text-xs">
        ⚠️ Webhook URLs can leak — anyone with the URL can post to your
        channel. Treat as secrets. Rotate if exposed.
      </div>
    </div>
  );
}
