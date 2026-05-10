"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JournalForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save entry");
      } else {
        setTitle("");
        setNotes("");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4"
    >
      <h2 className="font-semibold">New Journal Entry</h2>
      <div>
        <label className="block text-sm mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="AAPL momentum thesis — week 1"
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
        />
      </div>
      <div>
        <label className="block text-sm mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
          rows={5}
          placeholder="What did you decide? Why? What did you learn?"
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-indigo-600"
        />
      </div>
      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || !title.trim() || !notes.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
      >
        {submitting ? "Saving…" : "Save Entry"}
      </button>
    </form>
  );
}
