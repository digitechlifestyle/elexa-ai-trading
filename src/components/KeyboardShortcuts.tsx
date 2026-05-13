"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = {
  p: "/dashboard/portfolio",
  w: "/dashboard/watchlist",
  a: "/dashboard/analytics",
  j: "/dashboard/journal",
  c: "/dashboard/charts",
  s: "/dashboard/scanner",
  l: "/dashboard/alerts",
  b: "/dashboard/backtest",
  t: "/dashboard/auto-trade",
  d: "/dashboard",
  ".": "/dashboard/settings",
};

interface OrderResult {
  status: number;
  body: { error?: string };
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("1");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const lastG = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const t = e.target as HTMLElement;
      const editing =
        t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable;

      // Cmd+K / Ctrl+K → quick trade
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setMsg(null);
        return;
      }

      // Escape closes modals
      if (e.key === "Escape") {
        if (open) setOpen(false);
        if (helpOpen) setHelpOpen(false);
        return;
      }

      if (editing) return;

      // ? → help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // g + letter → navigation
      if (e.key.toLowerCase() === "g") {
        lastG.current = Date.now();
        return;
      }
      if (Date.now() - lastG.current < 1500) {
        const k = e.key.toLowerCase();
        if (ROUTES[k]) {
          e.preventDefault();
          router.push(ROUTES[k]);
          lastG.current = 0;
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, helpOpen, router]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim() || !qty.trim()) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trading/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "alpaca",
          symbol: symbol.toUpperCase(),
          qty: Number(qty),
          side,
        }),
      });
      const data = (await res.json()) as OrderResult["body"];
      if (!res.ok) {
        setMsg(`❌ ${data.error}`);
      } else {
        setMsg(`✓ ${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} submitted`);
        setSymbol("");
        setTimeout(() => setOpen(false), 1500);
      }
    } catch {
      setMsg("⚠️ Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Quick trade modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">⚡ Quick Paper Trade</h2>
              <kbd className="text-xs bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5 rounded">
                Esc
              </kbd>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                ref={inputRef}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Symbol — AAPL, BTC, GLD…"
                maxLength={12}
                required
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Qty"
                  required
                  className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setSide("buy")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    side === "buy"
                      ? "bg-green-700 border-green-600 text-white"
                      : "border-[var(--card-border)] text-[var(--muted)]"
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide("sell")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    side === "sell"
                      ? "bg-red-800 border-red-700 text-white"
                      : "border-[var(--card-border)] text-[var(--muted)]"
                  }`}
                >
                  Sell
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm"
              >
                {submitting ? "Submitting…" : `Submit ${side} order`}
              </button>
              {msg && (
                <div
                  className={`text-sm px-3 py-2 rounded-lg ${
                    msg.startsWith("✓")
                      ? "bg-green-950 border border-green-800 text-green-300"
                      : "bg-red-950 border border-red-800 text-red-300"
                  }`}
                >
                  {msg}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Help modal */}
      {helpOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold mb-3">⌨ Keyboard shortcuts</h2>
            <Row keys={["⌘", "K"]} action="Quick trade" />
            <Row keys={["?"]} action="Show this help" />
            <Row keys={["Esc"]} action="Close modal" />
            <p className="text-xs text-[var(--muted)] pt-3 border-t border-[var(--card-border)]">
              Press <kbd className="kbd">G</kbd> then any letter to navigate:
            </p>
            <Row keys={["G", "D"]} action="Dashboard" />
            <Row keys={["G", "P"]} action="Portfolio" />
            <Row keys={["G", "W"]} action="Watchlist" />
            <Row keys={["G", "C"]} action="Charts" />
            <Row keys={["G", "A"]} action="Analytics" />
            <Row keys={["G", "J"]} action="Journal" />
            <Row keys={["G", "S"]} action="Scanner" />
            <Row keys={["G", "L"]} action="Alerts" />
            <Row keys={["G", "B"]} action="Backtest" />
            <Row keys={["G", "T"]} action="Auto Trade" />
            <Row keys={["G", "."]} action="Settings" />
          </div>
        </div>
      )}
      <style jsx>{`
        .kbd {
          background: var(--background);
          border: 1px solid var(--card-border);
          padding: 1px 5px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
        }
      `}</style>
    </>
  );
}

function Row({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--muted)]">{action}</span>
      <span className="flex gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-xs font-mono"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
