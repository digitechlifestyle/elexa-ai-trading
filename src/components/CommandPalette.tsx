"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Command {
  label: string;
  href: string;
  icon: string;
  keywords?: string;
}

const COMMANDS: Command[] = [
  { label: "Overview", href: "/dashboard", icon: "📊", keywords: "home dashboard" },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: "💼", keywords: "trade positions" },
  { label: "Watchlist", href: "/dashboard/watchlist", icon: "👀" },
  { label: "Charts", href: "/dashboard/charts", icon: "📉", keywords: "tradingview" },
  { label: "Indicators", href: "/dashboard/indicators", icon: "📊", keywords: "rsi macd adx bollinger" },
  { label: "MACD Divergence", href: "/dashboard/macd-divergence", icon: "📐", keywords: "divergence bullish bearish hidden" },
  { label: "Implied Move", href: "/dashboard/implied-move", icon: "🎯", keywords: "straddle iv expected move standard deviation" },
  { label: "Journal AI Summary", href: "/dashboard/journal-summary", icon: "🧠", keywords: "journal coach review patterns claude" },
  { label: "Strength Meter", href: "/dashboard/strength-meter", icon: "💪", keywords: "relative strength rank momentum" },
  { label: "Anchored VWAP", href: "/dashboard/anchored-vwap", icon: "⚓", keywords: "vwap institutional cost basis" },
  { label: "Volume Profile", href: "/dashboard/volume-profile", icon: "📊", keywords: "vpvr poc value area support resistance" },
  { label: "Pairs Trade", href: "/dashboard/pairs-trade", icon: "⚖️", keywords: "pairs spread zscore cointegration arb" },
  { label: "Kelly Criterion", href: "/dashboard/kelly", icon: "📐", keywords: "kelly position size edge bankroll" },
  { label: "Multi-Timeframe", href: "/dashboard/mtf", icon: "📺" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { label: "Trade Replay", href: "/dashboard/trade-replay", icon: "🎬" },
  { label: "Portfolio Q&A", href: "/dashboard/portfolio-qa", icon: "💬" },
  { label: "Journal", href: "/dashboard/journal", icon: "📓" },
  { label: "Agents", href: "/dashboard/agents", icon: "🤖" },
  { label: "Scanner", href: "/dashboard/scanner", icon: "🔍" },
  { label: "52w Scanner", href: "/dashboard/scan-52w", icon: "🎯" },
  { label: "Top Movers", href: "/dashboard/movers", icon: "🚀" },
  { label: "Gap Scanner", href: "/dashboard/gap-scan", icon: "⏰" },
  { label: "Heatmap", href: "/dashboard/heatmap", icon: "🗺" },
  { label: "Earnings", href: "/dashboard/earnings", icon: "📊" },
  { label: "Sector RRG", href: "/dashboard/sectors", icon: "🔄" },
  { label: "Seasonality", href: "/dashboard/seasonality", icon: "🌀" },
  { label: "News + AI", href: "/dashboard/news", icon: "📰" },
  { label: "Macro", href: "/dashboard/macro", icon: "🏛" },
  { label: "Economy", href: "/dashboard/economy", icon: "🏦", keywords: "fred gdp cpi" },
  { label: "Yield Curve", href: "/dashboard/yield-curve", icon: "📐", keywords: "treasury rates" },
  { label: "Buffett Indicator", href: "/dashboard/buffett", icon: "📏" },
  { label: "Net Liquidity", href: "/dashboard/liquidity", icon: "💧", keywords: "fed tga rrp" },
  { label: "Correlation", href: "/dashboard/correlation", icon: "🔗" },
  { label: "VIX Term", href: "/dashboard/vix-term", icon: "📊", keywords: "volatility" },
  { label: "Sentiment", href: "/dashboard/sentiment", icon: "😱", keywords: "fear greed" },
  { label: "On-Chain", href: "/dashboard/onchain", icon: "⛓", keywords: "crypto coingecko" },
  { label: "COT", href: "/dashboard/cot", icon: "📋", keywords: "cftc futures" },
  { label: "Moon & Gann", href: "/dashboard/moon", icon: "🌙", keywords: "lunar seasonal" },
  { label: "Insider", href: "/dashboard/insider", icon: "🕵", keywords: "sec form 4" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "📅" },
  { label: "Alerts", href: "/dashboard/alerts", icon: "🔔" },
  { label: "Auto Trade", href: "/dashboard/auto-trade", icon: "✨" },
  { label: "AI Trade Plan", href: "/dashboard/trade-plan", icon: "🎯" },
  { label: "AI Review", href: "/dashboard/portfolio-review", icon: "🧠" },
  { label: "Risk Metrics", href: "/dashboard/risk-metrics", icon: "📐", keywords: "sharpe drawdown" },
  { label: "Concentration", href: "/dashboard/concentration", icon: "🎯", keywords: "hhi" },
  { label: "Stress Test", href: "/dashboard/stress-test", icon: "⚠️" },
  { label: "Tax Harvest", href: "/dashboard/tax-harvest", icon: "🧾" },
  { label: "Pre-Trade Check", href: "/dashboard/pre-trade", icon: "✅" },
  { label: "Monte Carlo", href: "/dashboard/montecarlo", icon: "🎲" },
  { label: "Position Size", href: "/dashboard/position-size", icon: "📏" },
  { label: "Profit Calc", href: "/dashboard/profit-calc", icon: "💰", keywords: "pnl leverage liquidation compound" },
  { label: "DCA Simulator", href: "/dashboard/dca", icon: "📅" },
  { label: "Risk Parity", href: "/dashboard/risk-parity", icon: "⚖️" },
  { label: "Options Pricer", href: "/dashboard/options-pricer", icon: "🧮", keywords: "black scholes greeks" },
  { label: "Options Payoff", href: "/dashboard/options-payoff", icon: "📈" },
  { label: "Trailing Stop", href: "/dashboard/trailing-stop", icon: "📉" },
  { label: "FX Converter", href: "/dashboard/fx", icon: "💱", keywords: "currency forex" },
  { label: "Drawdown Recovery", href: "/dashboard/drawdown-recovery", icon: "📉" },
  { label: "Beta Calculator", href: "/dashboard/beta", icon: "β" },
  { label: "Sharpe Screener", href: "/dashboard/sharpe-screener", icon: "📊" },
  { label: "Efficient Frontier", href: "/dashboard/frontier", icon: "📈", keywords: "markowitz" },
  { label: "Pivots & Fib", href: "/dashboard/levels", icon: "📐" },
  { label: "Tag Analytics", href: "/dashboard/tag-analytics", icon: "🏷" },
  { label: "Backtest", href: "/dashboard/backtest", icon: "🧪" },
  { label: "Strategy Builder", href: "/dashboard/strategy-builder", icon: "🛠" },
  { label: "Volatility Cone", href: "/dashboard/vol-cone", icon: "📊" },
  { label: "Backtest Compare", href: "/dashboard/backtest-compare", icon: "⚔️" },
  { label: "Leaderboard", href: "/leaderboard", icon: "🏆" },
  { label: "Tournaments", href: "/tournaments", icon: "🥇" },
  { label: "Feed", href: "/feed", icon: "📰" },
  { label: "Refer & Earn", href: "/dashboard/referrals", icon: "🎁" },
  { label: "API Keys", href: "/dashboard/api-keys", icon: "🔑" },
  { label: "Webhooks", href: "/dashboard/webhooks", icon: "📡" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  { label: "Guide", href: "/guide", icon: "📖" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = (() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS.slice(0, 12);
    const symbolMatch = /^[A-Z0-9./-]{1,12}$/i.test(q);
    const results = COMMANDS.filter((c) => {
      const hay = (c.label + " " + (c.keywords ?? "")).toLowerCase();
      return hay.includes(q);
    });
    if (symbolMatch) {
      results.unshift({
        label: `Open chart: ${q.toUpperCase()}`,
        href: `/dashboard/charts?symbol=${q.toUpperCase()}`,
        icon: "📉",
      });
      results.unshift({
        label: `Open indicators: ${q.toUpperCase()}`,
        href: `/dashboard/indicators?symbol=${q.toUpperCase()}`,
        icon: "📊",
      });
    }
    return results.slice(0, 12);
  })();

  function go(cmd: Command) {
    router.push(cmd.href);
    setOpen(false);
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) go(filtered[active]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--card-border)]">
          <span className="text-[var(--muted)]">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDownInput}
            placeholder="Search tools, type a symbol…"
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-[var(--muted)]"
          />
          <kbd className="text-xs bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>
        <div className="max-h-96 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">
              No matches.
            </p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={`${c.href}-${i}`}
                onClick={() => go(c)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${
                  active === i ? "bg-indigo-600 text-white" : "hover:bg-[var(--background)]"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-[var(--card-border)] flex justify-between text-[10px] text-[var(--muted)]">
          <span>
            <kbd className="bg-[var(--background)] border border-[var(--card-border)] px-1 rounded">↑↓</kbd> navigate ·{" "}
            <kbd className="bg-[var(--background)] border border-[var(--card-border)] px-1 rounded">↵</kbd> select
          </span>
          <span>
            <kbd className="bg-[var(--background)] border border-[var(--card-border)] px-1 rounded">⌘ P</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
