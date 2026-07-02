"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MarketFocus = "mixed" | "crypto" | "stocks" | "etfs";
type ExperienceLevel = "beginner" | "intermediate" | "advanced";
type ConnectionMode = "demo" | "read_only" | "paper";

const MARKET_FOCUS: Array<{
  id: MarketFocus;
  name: string;
  desc: string;
  icon: string;
}> = [
  {
    id: "mixed",
    name: "Mixed markets",
    desc: "Stocks, ETFs, crypto and commodity-linked ETFs in one research workflow.",
    icon: "🌍",
  },
  {
    id: "crypto",
    name: "Crypto assets",
    desc: "BTC, ETH, XRP, SOL, stablecoins and exchange watchlists.",
    icon: "🪙",
  },
  {
    id: "stocks",
    name: "Stocks",
    desc: "Large-cap shares, AI names, tech stocks and market leaders.",
    icon: "📈",
  },
  {
    id: "etfs",
    name: "ETFs and commodities",
    desc: "Broad ETFs plus GLD, SLV, USO and other market exposure symbols.",
    icon: "⚖️",
  },
];

const EXPERIENCE_LEVELS: Array<{
  id: ExperienceLevel;
  name: string;
  desc: string;
}> = [
  {
    id: "beginner",
    name: "Beginner",
    desc: "Best for learning the dashboard with lower simulated risk and more guidance.",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    desc: "Best for users who already understand basic market orders and risk control.",
  },
  {
    id: "advanced",
    name: "Advanced",
    desc: "Best for experienced users who want broader tools, scanners and deeper analysis.",
  },
];

const CONNECTION_MODES: Array<{
  id: ConnectionMode;
  name: string;
  desc: string;
  safeNote: string;
}> = [
  {
    id: "demo",
    name: "Demo mode",
    desc: "Explore Elexa with sample data and no exchange connection.",
    safeNote: "Safest start — no keys required.",
  },
  {
    id: "read_only",
    name: "Read-only connection",
    desc: "Use exchange data for balances, watchlists and research context only.",
    safeNote: "No withdrawals, no transfers, no live orders.",
  },
  {
    id: "paper",
    name: "Paper / sandbox mode",
    desc: "Use sandbox or paper-trading keys where supported, starting with Alpaca Paper.",
    safeNote: "Simulation first — no real-money execution at launch.",
  },
];

const RISK_PRESETS = {
  beginner: {
    id: "conservative",
    name: "Conservative",
    desc: "Smaller simulated trades, lower daily loss limits and tighter stops.",
    limits: {
      max_position_size_usd: 1000,
      max_daily_loss_usd: 200,
      max_open_positions: 5,
      stop_loss_pct: 3,
    },
  },
  intermediate: {
    id: "balanced",
    name: "Balanced",
    desc: "Default simulated risk profile for most users.",
    limits: {
      max_position_size_usd: 5000,
      max_daily_loss_usd: 500,
      max_open_positions: 10,
      stop_loss_pct: 5,
    },
  },
  advanced: {
    id: "advanced-research",
    name: "Advanced research",
    desc: "Larger simulated limits for experienced users, still not real-money execution.",
    limits: {
      max_position_size_usd: 10000,
      max_daily_loss_usd: 1000,
      max_open_positions: 15,
      stop_loss_pct: 8,
    },
  },
};

const WATCHLIST_PRESETS: Record<MarketFocus, Array<{ label: string; symbols: string[] }>> = {
  mixed: [
    { label: "AI + tech", symbols: ["AAPL", "MSFT", "NVDA", "GOOGL"] },
    { label: "Major crypto", symbols: ["BTC", "ETH", "XRP", "SOL"] },
    { label: "ETF exposure", symbols: ["SPY", "QQQ", "GLD", "SLV"] },
  ],
  crypto: [
    { label: "Major crypto", symbols: ["BTC", "ETH", "XRP", "SOL"] },
    { label: "Utility crypto", symbols: ["ADA", "HBAR", "XLM", "XDC"] },
    { label: "High-risk crypto watch", symbols: ["DOGE", "SHIB", "PEPE", "BONK"] },
    { label: "Stablecoins", symbols: ["USDT", "USDC"] },
  ],
  stocks: [
    { label: "Tech leaders", symbols: ["AAPL", "MSFT", "NVDA", "GOOGL"] },
    { label: "Growth names", symbols: ["TSLA", "AMD", "META", "AMZN"] },
    { label: "Market ETFs", symbols: ["SPY", "QQQ", "DIA", "IWM"] },
  ],
  etfs: [
    { label: "Core ETFs", symbols: ["SPY", "QQQ", "DIA", "IWM"] },
    { label: "Commodity-linked", symbols: ["GLD", "SLV", "USO", "UNG"] },
    { label: "Crypto proxy", symbols: ["BTC", "ETH"] },
  ],
};

const STEPS = [
  "Welcome",
  "Market focus",
  "Experience",
  "Connection",
  "Watchlist",
  "Done",
] as const;

export default function OnboardingWizard({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [marketFocus, setMarketFocus] = useState<MarketFocus | null>(null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode | null>(null);
  const [watchSymbols, setWatchSymbols] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const risk = experience ? RISK_PRESETS[experience] : null;
  const watchlistGroups = useMemo(
    () => WATCHLIST_PRESETS[marketFocus ?? "mixed"],
    [marketFocus]
  );
  const availableSymbols = useMemo(
    () => Array.from(new Set(watchlistGroups.flatMap((p) => p.symbols))),
    [watchlistGroups]
  );

  function toggleSymbol(sym: string) {
    setWatchSymbols((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  }

  function chooseMarket(focus: MarketFocus) {
    setMarketFocus(focus);
    setWatchSymbols([]);
  }

  async function applyRisk() {
    if (!risk) return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(risk.limits),
    });
  }

  async function applyWatchlist() {
    for (const sym of watchSymbols) {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await applyRisk();
      if (watchSymbols.length > 0) await applyWatchlist();
      await fetch("/api/onboarding/complete", { method: "POST" });

      if (connectionMode === "read_only" || connectionMode === "paper") {
        router.push("/dashboard/connections");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const canContinue =
    step === 0 ||
    (step === 1 && !!marketFocus) ||
    (step === 2 && !!experience) ||
    (step === 3 && !!connectionMode) ||
    (step === 4 && watchSymbols.length >= 3);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8 text-xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                  i <= step
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--background)] text-[var(--muted)]"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    i < step ? "bg-indigo-600" : "bg-[var(--card-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5 text-center">
            <div className="text-5xl">👋</div>
            <h1 className="text-2xl font-bold">Welcome to Elexa</h1>
            <p className="text-[var(--muted)]">
              Signed in as <span className="font-medium">{email}</span>. Let&apos;s set up a safe research dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left text-sm">
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="font-semibold mb-1">1. Choose markets</p>
                <p className="text-[var(--muted)]">Stocks, crypto, ETFs or a mixed dashboard.</p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="font-semibold mb-1">2. Choose connection</p>
                <p className="text-[var(--muted)]">Demo, read-only or paper/sandbox mode.</p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="font-semibold mb-1">3. Build watchlist</p>
                <p className="text-[var(--muted)]">Start with at least 3 symbols.</p>
              </div>
            </div>
            <p className="text-xs text-amber-300 bg-amber-950 border border-amber-800 rounded-lg p-3">
              Launch mode is for research, journaling and simulated strategy testing only. No real-money execution.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Choose your market focus</h1>
            <p className="text-[var(--muted)] text-sm">
              This controls your starter watchlist and the first tools we recommend.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARKET_FOCUS.map((focus) => (
                <button
                  key={focus.id}
                  onClick={() => chooseMarket(focus.id)}
                  className={`text-left border rounded-xl p-4 transition-colors ${
                    marketFocus === focus.id
                      ? "border-indigo-500 bg-indigo-950"
                      : "border-[var(--card-border)] hover:border-indigo-700"
                  }`}
                >
                  <p className="font-semibold text-lg">
                    <span className="mr-2">{focus.icon}</span>
                    {focus.name}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2">{focus.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Choose your experience level</h1>
            <p className="text-[var(--muted)] text-sm">
              Elexa will set a starter simulated risk profile from this. You can change it later.
            </p>
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => {
                const preset = RISK_PRESETS[level.id];
                return (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`block w-full text-left border rounded-xl p-4 transition-colors ${
                      experience === level.id
                        ? "border-indigo-500 bg-indigo-950"
                        : "border-[var(--card-border)] hover:border-indigo-700"
                    }`}
                  >
                    <p className="font-semibold">{level.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{level.desc}</p>
                    <p className="text-xs text-[var(--muted)] mt-2">
                      Starter profile: {preset.name} · Max simulated position ${preset.limits.max_position_size_usd} · Daily loss ${preset.limits.max_daily_loss_usd}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Choose your connection mode</h1>
            <p className="text-[var(--muted)] text-sm">
              Start safely. You can add more exchange options from the Connections page later.
            </p>
            <div className="space-y-3">
              {CONNECTION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setConnectionMode(mode.id)}
                  className={`block w-full text-left border rounded-xl p-4 transition-colors ${
                    connectionMode === mode.id
                      ? "border-indigo-500 bg-indigo-950"
                      : "border-[var(--card-border)] hover:border-indigo-700"
                  }`}
                >
                  <p className="font-semibold">{mode.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{mode.desc}</p>
                  <p className="text-xs text-amber-300 mt-2">{mode.safeNote}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Build your first watchlist</h1>
            <p className="text-[var(--muted)] text-sm">
              Pick at least 3 symbols. You can add more later.
            </p>
            <div className="space-y-4">
              {watchlistGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-indigo-300 mb-2">{group.label}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {group.symbols.map((sym) => {
                      const selected = watchSymbols.includes(sym);
                      return (
                        <button
                          key={sym}
                          onClick={() => toggleSymbol(sym)}
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
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {watchSymbols.length === 0 ? (
                <span>Pick some above ↑</span>
              ) : (
                <span>{watchSymbols.length} selected · {watchSymbols.join(", ")}</span>
              )}
            </div>
            <button
              onClick={() => setWatchSymbols(availableSymbols.slice(0, 8))}
              className="text-xs text-indigo-300 hover:text-indigo-200"
            >
              Use recommended starter watchlist
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold">Your research dashboard is ready</h1>
            <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-sm text-left max-w-lg mx-auto space-y-2">
              <p><span className="text-[var(--muted)]">Market focus:</span> {MARKET_FOCUS.find((m) => m.id === marketFocus)?.name}</p>
              <p><span className="text-[var(--muted)]">Experience:</span> {EXPERIENCE_LEVELS.find((e) => e.id === experience)?.name}</p>
              <p><span className="text-[var(--muted)]">Connection:</span> {CONNECTION_MODES.find((m) => m.id === connectionMode)?.name}</p>
              <p><span className="text-[var(--muted)]">Watchlist:</span> {watchSymbols.join(", ")}</p>
            </div>
            <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
              Elexa will open the dashboard or the Connections page depending on the mode you selected.
            </p>
            <button
              onClick={finish}
              disabled={busy}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold text-sm"
            >
              {busy ? "Saving…" : "Finish setup"}
            </button>
          </div>
        )}

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
                disabled={busy || !canContinue}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold text-sm"
              >
                Continue →
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
              Start setup →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
