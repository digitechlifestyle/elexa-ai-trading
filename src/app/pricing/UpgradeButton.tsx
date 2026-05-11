"use client";

import { useState } from "react";

export default function UpgradeButton({
  plan,
  label,
  highlight,
  hrefIfFree,
}: {
  plan: "researcher" | "pro" | "team";
  label: string;
  highlight: boolean;
  hrefIfFree?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    if (hrefIfFree) {
      window.location.href = hrefIfFree;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout");
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={upgrade}
        disabled={loading}
        className={`w-full text-center py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
          highlight
            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
            : "border border-[var(--card-border)] hover:border-indigo-600 text-white"
        }`}
      >
        {loading ? "Loading…" : label}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </>
  );
}
