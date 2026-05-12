"use client";

import { useState } from "react";

const SUGGESTED = ["scalp", "swing", "momentum", "mean-reversion", "earnings", "test", "winner", "loser"];

export default function TradeTags({
  tradeId,
  initial,
}: {
  tradeId: string;
  initial: string[];
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(next: string[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      const data = await res.json();
      if (res.ok) setTags(data.tags);
    } finally {
      setSaving(false);
    }
  }

  function add(tag: string) {
    const cleaned = tag.trim().slice(0, 20);
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    if (tags.length >= 10) return;
    save([...tags, cleaned]);
    setInput("");
  }

  function remove(tag: string) {
    save(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs px-1.5 py-0.5 rounded"
        >
          {t}
          <button
            type="button"
            onClick={() => remove(t)}
            className="hover:text-red-400"
            aria-label="Remove"
          >
            ×
          </button>
        </span>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={saving || tags.length >= 10}
          className="text-xs text-[var(--muted)] hover:text-indigo-400 underline disabled:opacity-30"
        >
          + tag
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-xl z-30 p-2 space-y-2">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(input);
                  setOpen(false);
                }
              }}
              placeholder="New tag…"
              maxLength={20}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-2 py-1 text-xs"
            />
            <div className="flex flex-wrap gap-1">
              {SUGGESTED.filter((s) => !tags.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    add(s);
                    setOpen(false);
                  }}
                  className="text-xs bg-[var(--background)] hover:border-indigo-600 border border-[var(--card-border)] px-1.5 py-0.5 rounded"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
