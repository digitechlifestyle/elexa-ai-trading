"use client";

import { useEffect, useState } from "react";

interface Status {
  platform_enabled: boolean;
  disclaimer_version: string;
  consent_accepted: boolean;
  broker_connected: boolean;
  broker_last4: string | null;
  broker_connected_at: string | null;
}

// Placeholder copy capturing the substance of what a real disclaimer needs
// to cover — LAUNCH-CHECKLIST.md requires an actual lawyer-reviewed version
// before LIVE_TRADING_ENABLED is ever set to true. Do not treat this text as
// sufficient on its own.
const DISCLAIMER_TEXT = `Live trading places real orders against your own connected brokerage
account using your own funds. This is not paper trading — orders can result
in real financial gains or losses, including the loss of your full position.

Elexa AI Trading provides tools and AI-generated trade proposals for your own
review. It does not manage your money, does not custody your funds, and does
not place any order without your action. All trading decisions and their
outcomes are yours alone.

Market data, AI agent output, and backtested performance are not guarantees
of future results. You are responsible for your own tax and regulatory
obligations related to your trading activity.

By accepting, you confirm you understand these risks and that you are
trading with funds you can afford to lose.`;

export default function LiveTradingClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [checked, setChecked] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/live-trading/status");
      const data = await res.json();
      if (res.ok) setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function connectBroker(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/broker-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange: "alpaca", api_key: apiKey, api_secret: apiSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Failed to connect");
      } else {
        setMsg(`Connected — Alpaca account ending in ${data.last4}`);
        setApiKey("");
        setApiSecret("");
        loadStatus();
      }
    } finally {
      setBusy(false);
    }
  }

  async function disconnectBroker() {
    if (!confirm("Disconnect your live Alpaca account? You won't be able to place live trades until you reconnect.")) return;
    setBusy(true);
    try {
      await fetch("/api/broker-connections?exchange=alpaca", { method: "DELETE" });
      loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function acceptDisclaimer() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/live-trading/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Failed to record acceptance");
      else loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function placeLiveOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/trading/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange: "alpaca", symbol, qty: Number(qty), side, order_type: "market" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Order failed");
      } else {
        setMsg(`✓ LIVE ${side} order submitted for ${qty} × ${symbol.toUpperCase()}`);
        setSymbol("");
        setQty("");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading || !status) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  const readyToTrade = status.platform_enabled && status.consent_accepted && status.broker_connected;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Live Trading</h1>
        <p className="text-[var(--muted)] text-sm">
          Real orders, your own Alpaca account, your own money. Three steps required below.
        </p>
      </div>

      <div
        className={`rounded-xl px-5 py-3 text-sm border ${
          status.platform_enabled
            ? "bg-red-950 border-red-800 text-red-300"
            : "bg-amber-950 border-amber-800 text-amber-300"
        }`}
      >
        {status.platform_enabled ? (
          <strong>⚠️ Live trading is enabled on this platform.</strong>
        ) : (
          <>
            <strong>Live trading is not enabled on this platform yet.</strong>{" "}
            You can still connect your account and accept the disclaimer below —
            orders will start working once it&apos;s turned on.
          </>
        )}
      </div>

      {err && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>
      )}
      {msg && (
        <div className="bg-green-950 border border-green-800 text-green-300 text-sm rounded-lg px-3 py-2">{msg}</div>
      )}

      {/* Step 1: Connect broker */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">1. Connect your Alpaca live account</h2>
        {status.broker_connected ? (
          <div className="flex items-center justify-between text-sm">
            <p>
              ✓ Connected — key ending in <span className="font-mono">{status.broker_last4}</span>
            </p>
            <button
              onClick={disconnectBroker}
              disabled={busy}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={connectBroker} className="space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Use LIVE keys from your funded Alpaca account (not paper keys) —{" "}
              <a href="https://app.alpaca.markets" target="_blank" rel="noreferrer" className="underline">
                app.alpaca.markets
              </a>
              . Stored encrypted; never shown again after saving.
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Alpaca API Key ID"
              required
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-600"
            />
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Alpaca API Secret Key"
              required
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              {busy ? "Verifying…" : "Connect account"}
            </button>
          </form>
        )}
      </div>

      {/* Step 2: Disclaimer */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">2. Accept the risk disclaimer</h2>
        {status.consent_accepted ? (
          <p className="text-sm">✓ Accepted (version {status.disclaimer_version})</p>
        ) : (
          <>
            <pre className="bg-[var(--background)] border border-[var(--card-border)] rounded p-4 text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {DISCLAIMER_TEXT}
            </pre>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1"
              />
              I have read this and understand the risks of live trading.
            </label>
            <button
              onClick={acceptDisclaimer}
              disabled={!checked || busy}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Accept and continue
            </button>
          </>
        )}
      </div>

      {/* Step 3: Place a live order */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">3. Place a live order</h2>
        {!readyToTrade ? (
          <p className="text-sm text-[var(--muted)]">
            Complete steps 1 and 2{status.platform_enabled ? "" : ", and wait for live trading to be enabled,"} to unlock this.
          </p>
        ) : (
          <form onSubmit={placeLiveOrder} className="space-y-3">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol (e.g. AAPL, BTC)"
              required
              maxLength={12}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
            />
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Quantity"
              required
              min={0.000001}
              step="any"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  side === "buy" ? "bg-green-700 border-green-600 text-white" : "border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  side === "sell" ? "bg-red-800 border-red-700 text-white" : "border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                Sell
              </button>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              {busy ? "Submitting…" : "Submit LIVE order (real money)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
