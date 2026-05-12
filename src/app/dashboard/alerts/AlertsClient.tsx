"use client";

import { useState } from "react";

interface Alert {
  id: string;
  symbol: string;
  kind: "price_above" | "price_below" | "pnl_above_pct" | "pnl_below_pct";
  value: number;
  created_at: string;
  triggered_at?: string | null;
}

const KIND_LABELS: Record<Alert["kind"], string> = {
  price_above: "Price rises above",
  price_below: "Price falls below",
  pnl_above_pct: "P&L on position rises above (%)",
  pnl_below_pct: "P&L on position falls below (%)",
};

export default function AlertsClient({ initial }: { initial: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initial);
  const [symbol, setSymbol] = useState("AAPL");
  const [kind, setKind] = useState<Alert["kind"]>("price_above");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, kind, value: Number(value) }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Failed");
      else {
        setAlerts(data.alerts);
        setValue("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setAlerts(data.alerts);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Alerts</h1>
        <p className="text-[var(--muted)] text-sm">
          Get notified when a price or P&amp;L threshold is crossed. Checked
          every 5 minutes. Notifications show in your bell icon.
        </p>
      </div>

      <form
        onSubmit={add}
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            required
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-[var(--muted)] mb-1">Trigger</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Alert["kind"])}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          >
            {Object.entries(KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Value {kind.includes("pct") ? "(%)" : "($)"}
          </label>
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="md:col-span-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm"
        >
          {busy ? "…" : "Add Alert"}
        </button>
      </form>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Active alerts ({alerts.length}/20)</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No alerts yet.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex justify-between items-center text-sm border-b border-[var(--card-border)] last:border-0 py-2"
              >
                <div>
                  <span className="font-medium">{a.symbol}</span>{" "}
                  <span className="text-[var(--muted)]">
                    {KIND_LABELS[a.kind]} {a.value}
                    {a.kind.includes("pct") ? "%" : ""}
                  </span>
                  {a.triggered_at && (
                    <span className="ml-2 text-xs text-green-400">
                      ✓ Triggered {new Date(a.triggered_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => remove(a.id)}
                  disabled={busy}
                  className="text-xs text-[var(--muted)] hover:text-red-400 underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
