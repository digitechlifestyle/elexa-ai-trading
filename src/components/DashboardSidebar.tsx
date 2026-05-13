"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: "👀" },
  { href: "/dashboard/charts", label: "Charts", icon: "📉" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
  { href: "/dashboard/journal", label: "Journal", icon: "📓" },
  { href: "/dashboard/agents", label: "Agents", icon: "🤖" },
  { href: "/dashboard/scanner", label: "Scanner", icon: "🔍" },
  { href: "/dashboard/news", label: "News + AI", icon: "📰" },
  { href: "/dashboard/macro", label: "Macro", icon: "🏛" },
  { href: "/dashboard/economy", label: "Economy", icon: "🏦" },
  { href: "/dashboard/yield-curve", label: "Yield Curve", icon: "📐" },
  { href: "/dashboard/buffett", label: "Buffett", icon: "📏" },
  { href: "/dashboard/liquidity", label: "Net Liquidity", icon: "💧" },
  { href: "/dashboard/correlation", label: "Correlation", icon: "🔗" },
  { href: "/dashboard/vix-term", label: "VIX Term", icon: "📊" },
  { href: "/dashboard/sentiment", label: "Sentiment", icon: "😱" },
  { href: "/dashboard/onchain", label: "On-Chain", icon: "⛓" },
  { href: "/dashboard/cot", label: "COT", icon: "📋" },
  { href: "/dashboard/moon", label: "Moon & Gann", icon: "🌙" },
  { href: "/dashboard/insider", label: "Insider", icon: "🕵" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "📅" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/auto-trade", label: "Auto Trade", icon: "✨" },
  { href: "/dashboard/portfolio-review", label: "AI Review", icon: "🧠" },
  { href: "/dashboard/risk-metrics", label: "Risk Metrics", icon: "📐" },
  { href: "/dashboard/montecarlo", label: "Monte Carlo", icon: "🎲" },
  { href: "/dashboard/backtest", label: "Backtest", icon: "🧪" },
  { href: "/dashboard/strategy-builder", label: "Strategy Builder", icon: "🛠" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/tournaments", label: "Tournaments", icon: "🥇" },
  { href: "/feed", label: "Feed", icon: "📰" },
  { href: "/dashboard/referrals", label: "Refer & Earn", icon: "🎁" },
  { href: "/dashboard/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  { href: "/guide", label: "Guide", icon: "📖" },
];

export default function DashboardSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3 bg-[var(--card)] sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--background)]"
          aria-label="Open menu"
        >
          ☰
        </button>
        <Link href="/" className="font-bold text-indigo-400">
          Elexa AI
        </Link>
        <div className="w-9" />
      </div>

      {/* Drawer backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <aside
        className={`
          md:w-60 md:border-r md:border-[var(--card-border)] md:bg-[var(--card)]
          md:flex md:flex-col md:p-4 md:shrink-0 md:static md:translate-x-0
          fixed inset-y-0 left-0 w-72 bg-[var(--card)] border-r border-[var(--card-border)]
          p-4 flex flex-col z-50 transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="text-lg font-bold text-indigo-400 block px-2"
          >
            Elexa AI
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--background)] text-[var(--muted)]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 px-2 py-1.5 bg-amber-950 border border-amber-800 rounded-lg text-amber-300 text-xs text-center">
          📄 Paper Trading Mode
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--card-border)] pt-4 mt-4">
          <p className="text-xs text-[var(--muted)] px-2 mb-3 truncate">
            {email}
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-xs text-[var(--muted)] hover:text-white px-2 py-1.5 rounded transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
