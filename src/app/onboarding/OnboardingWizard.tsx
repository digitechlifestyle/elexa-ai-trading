"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RISK_PRESETS = [
  {
    id: "conservative",
    name: "Conservative",
    desc: "Smaller trades, tight stops. Best for learning.",
    limits: {
      max_position_size_usd: 1000,
      max_daily_loss_usd: 200,
      max_open_positions: 5,
      stop_loss_pct: 3,
    },
  },
  {
    id: "balanced",
    name: "Balanced (recommended)",
    desc: "Default risk profile. Same as the system defaults.",
    limits: {
      max_position_size_usd: 5000,
      max_daily_loss_usd: 500,
      max_open_positions: 10,
      stop_loss_pct: 5,
    },
  },
  {
    id: "aggressive",
    name: "Aggressive",
    desc: "Larger trades, wider stops. For experienced traders.",
    limits: {
      max_position_size_usd: 15000,
      max_daily_loss_usd: 1500,
      max_open_positions: 20,
      stop_loss_pct: 10,
    },
  },
];

const WATCHLIST_PRESETS = [
  { label: "Tech stocks", symbols: ["AAPL", "MSFT", "NVDA", "GOOGL"] },
  { label: "Big crypto", symbols: ["BTC", "ETH", "SOL", "XRP"] },
  { label: "Commodities", symbols: ["GLD", "SLV", "USO"] },
  { label: "Meme coins", symbols: ["DOGE", "SHIB", "PEPE"] },
];

const STEPS = [
  "Welcome",
  "Risk profile",
  "Watchlist",
  "First trade",
  "Done",
] as const;

export default function OnboardingWizard({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [risk, setRisk] = useState<typeof RISK_PRESETS[0] | null>(null);
  const [watchSymbols, setWatchSymbols] = useState<string[]>([]);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function applyRisk() {
    if (!risk) return;
    setBusy(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(risk.limits),
      });
    } finally {
      setBusy(false);
    }
  }

  async function applyWatchlist() {
    setBusy(true);
    try {
      for (const sym of watchSymbols) {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: sym }),
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function placePractice() {
    setBusy(true);
    setTradeStatus(null);
    try {
      const res = await fetch("/api/trading/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "alpaca",
          symbol: "AAPL",
          qty: 1,
          side: "buy",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTradeStatus("✓ Practice trade submitted — 1 share of AAPL");
      } else {
        setTradeStatus(`⚠ ${data.error ?? "Failed"}`);
      }
    } catch {
      setTradeStatus("⚠ Network error");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (step === 1 && risk) await applyRisk();
    if (step === 2 && watchSymbols.length > 0) await applyWatchlist();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 text-xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                  i <= step ? "bg-indigo-600 text-white" : "bg-[var(--background)] text-[var(--muted)]"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-indigo-600" : "bg-[var(--card-border)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="space-y-5 text-center">
            <div className="text-5xl">👋</div>
            <h1 className="text-2xl font-bold">Welcome to Elexa</h1>
            <p className="text-[var(--muted)]">
              Signed in as <span className="font-medium">{email}</span>. Three quick steps to get you trading.
            </p>
            <ul className="text-left text-sm text-[var(--muted)] max-w-md mx-auto space-y-2">
              <li>1. Pick a risk profile (you can change later)</li>
              <li>2. Build your watchlist (3–10 symbols)</li>
              <li>3. Place a practice paper trade</li>
            </ul>
          </div>
        )}

        {/* Step 1 — Risk profile */}
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Pick a risk profile</h1>
            <p className="text-[var(--muted)] text-sm">
              Hard limits enforced server-side on every order. You can adjust them anytime in Settings.
            </p>
            <div className="space-y-3">
              {RISK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRisk(p)}
                  className={`block w-full text-left border rounded-xl p-4 transition-colors ${
                    risk?.id === p.id
                      ? "border-indigo-500 bg-indigo-950"
                      : "border-[var(--card-border)] hover:border-indigo-700"
                  }`}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{p.desc}</p>
                  <p className="text-xs text-[var(--muted)] mt-2">
                    Max position ${p.limits.max_position_size_usd} · Daily loss ${p.limits.max_daily_loss_usd} · Stop {p.limits.stop_loss_pct}%
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Watchlist */}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Build your watchlist</h1>
            <p className="text-[var(--muted)] text-sm">
              Pick at least 3 symbols. You can add more later.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {WATCHLIST_PRESETS.flatMap((p) => p.symbols).map((sym) => {
                const selected = watchSymbols.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() =>
                      setWatchSymbols((prev) =>
                        prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
                      )
                    }
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      selected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-[var(--card-border)] text-[var(--muted)] hover:border-indigo-700"
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {watchSymbols.length === 0
                ? "Pick some above ↑"
                : `${watchSymbols.length} selected · ${watchSymbols.join(", ")}`}
            </p>
          </div>
        )}

        {/* Step 3 — First trade */}
        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Place a practice trade</h1>
            <p className="text-[var(--muted)] text-sm">
              We&apos;ll place a 1-share AAPL buy order — paper only, no real money. This proves your account works end-to-end.
            </p>
            <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Exchange</span><span>Alpaca</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Symbol</span><span>AAPL</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Quantity</span><span>1 share</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Side</span><span className="text-green-400">BUY</span></div>
            </div>
            {tradeStatus ? (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  tradeStatus.startsWith("✓")
                    ? "bg-green-950 border border-green-800 text-green-300"
                    : "bg-amber-950 border border-amber-800 text-amber-200"
                }`}
              >
                {tradeStatus}
              </div>
            ) : (
              <button
                onClick={placePractice}
                disabled={busy}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm"
              >
                {busy ? "Placing…" : "Place practice trade"}
              </button>
            )}
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold">You&apos;re all set</h1>
            <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
              Your dashboard is ready. Place trades, run AI agents, journal your decisions, track P&amp;L.
            </p>
            <button
              onClick={finish}
              disabled={busy}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold text-sm"
            >
              {busy ? "Loading…" : "Open Dashboard"}
            </button>
          </div>
        )}

        {/* Nav buttons */}
        {step > 0 && step < STEPS.length - 1 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--card-border)]">
            <button
              onClick={back}
              disabled={busy}
              className="text-sm text-[var(--muted)] hover:text-white disabled:opacity-50"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              <a
                href="/dashboard"
                onClick={() => fetch("/api/onboarding/complete", { method: "POST" })}
                className="text-sm text-[var(--muted)] hover:text-white py-2 px-3"
              >
                Skip
              </a>
              <button
                onClick={next}
                disabled={
                  busy ||
                  (step === 1 && !risk) ||
                  (step === 2 && watchSymbols.length < 3) ||
                  (step === 3 && !tradeStatus?.startsWith("✓"))
                }
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold text-sm"
              >
                {busy ? "…" : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {step === 0 && (
          <div className="flex justify-end mt-8 pt-6 border-t border-[var(--card-border)]">
            <button
              onClick={next}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold text-sm"
            >
              Let&apos;s go →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
