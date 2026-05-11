"use client";

import { useState } from "react";

export default function ShareTradeButton({ tradeId }: { tradeId: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade_id: tradeId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setUrl(data.url);
        try {
          await navigator.clipboard.writeText(data.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // ignore
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <div className="flex flex-col items-end gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 underline hover:text-indigo-300"
        >
          {copied ? "✓ Link copied" : "View shared"}
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just shared a paper trade on Elexa AI Trading")}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted)] hover:text-white"
        >
          𝕏 Tweet
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={share}
      disabled={busy}
      className="text-xs text-[var(--muted)] hover:text-indigo-400 underline"
      title="Make public + share"
    >
      {busy ? "…" : "Share"}
    </button>
  );
}
