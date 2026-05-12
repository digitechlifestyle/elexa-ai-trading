"use client";

import { useEffect, useState } from "react";

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used_at?: string | null;
}

export default function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdPlain, setCreatedPlain] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (res.ok) setKeys(data.keys ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setCreatedPlain(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || "Untitled" }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Failed");
      else {
        setCreatedPlain(data.key?.plain ?? null);
        setLabel("");
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this API key? Cannot be undone.")) return;
    setBusy(true);
    try {
      await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">API Keys</h1>
        <p className="text-[var(--muted)] text-sm">
          Read-only programmatic access to your account. Use with{" "}
          <code className="bg-[var(--card)] px-1.5 py-0.5 rounded text-xs">
            Authorization: Bearer eai_…
          </code>{" "}
          header.
        </p>
      </div>

      {createdPlain && (
        <div className="bg-amber-950 border-2 border-amber-700 rounded-xl p-6 space-y-3">
          <p className="font-semibold text-amber-200">
            ⚠️ Copy this key now — you will not see it again
          </p>
          <pre className="bg-[var(--background)] border border-[var(--card-border)] rounded p-3 text-xs font-mono break-all">
            {createdPlain}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(createdPlain);
            }}
            className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-1.5 rounded text-sm font-semibold"
          >
            Copy to clipboard
          </button>
          <button
            onClick={() => setCreatedPlain(null)}
            className="text-amber-300 text-xs underline ml-3"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={create}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 flex gap-3 items-end"
      >
        <div className="flex-1">
          <label className="block text-xs text-[var(--muted)] mb-1">
            Label (e.g. &quot;Trading bot v2&quot;)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
        >
          {busy ? "…" : "Create API Key"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Active keys ({keys.length}/5)</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No keys yet.</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex justify-between items-center text-sm border-b border-[var(--card-border)] last:border-0 py-3"
              >
                <div>
                  <p className="font-medium">{k.label}</p>
                  <p className="text-xs text-[var(--muted)] font-mono">
                    {k.prefix}…
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Created {new Date(k.created_at).toLocaleDateString()}{" "}
                    {k.last_used_at
                      ? `· Last used ${new Date(k.last_used_at).toLocaleString()}`
                      : "· Never used"}
                  </p>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  disabled={busy}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-3 text-sm">
        <h2 className="font-semibold">Endpoints</h2>
        <pre className="bg-[var(--background)] border border-[var(--card-border)] rounded p-3 text-xs whitespace-pre-wrap leading-relaxed">{`GET /api/v1/account
GET /api/v1/positions
GET /api/v1/trades?limit=100

Headers:
  Authorization: Bearer eai_<your_key>

Example:
  curl https://elexa-ai-trading.vercel.app/api/v1/account \\
    -H "Authorization: Bearer eai_xxxx"`}</pre>
        <p className="text-xs text-[var(--muted)]">
          Read-only. No order placement via API in MVP. All endpoints return
          JSON. Not financial advice.
        </p>
      </div>
    </div>
  );
}
