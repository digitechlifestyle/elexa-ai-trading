"use client";

import { useState } from "react";

export default function ProfileForm({
  initialDisplayName,
  initialOptIn,
}: {
  initialDisplayName: string;
  initialOptIn: boolean;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          public_leaderboard_opt_in: optIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) setStatus({ ok: false, msg: data.error ?? "Failed" });
      else setStatus({ ok: true, msg: "Profile updated." });
    } catch {
      setStatus({ ok: false, msg: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-5"
    >
      <div>
        <h2 className="font-semibold mb-1">Public profile</h2>
        <p className="text-xs text-[var(--muted)]">
          Show on the public leaderboard. Off by default. P&amp;L only — no
          personal info shared.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          placeholder="e.g. quant_trader_42"
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
        />
        <p className="text-xs text-[var(--muted)] mt-1.5">
          Shown on leaderboard + shared trade cards. Max 30 chars.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
          className="mt-1"
        />
        <div>
          <p className="text-sm font-medium">Show me on public leaderboard</p>
          <p className="text-xs text-[var(--muted)]">
            Display your name and P&amp;L publicly at <code>/leaderboard</code>.
            Turn off anytime.
          </p>
        </div>
      </label>

      {status && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            status.ok
              ? "bg-green-950 border border-green-800 text-green-300"
              : "bg-red-950 border border-red-800 text-red-300"
          }`}
        >
          {status.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
