"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem { href: string; label: string; icon: string; }
interface NavGroup { title: string; emoji: string; items: NavItem[]; }

const groups: NavGroup[] = [
  {
    title: "Trade",
    emoji: "💼",
    items: [
      { href: "/dashboard", label: "Overview", icon: "📊" },
      { href: "/dashboard/portfolio", label: "Portfolio", icon: "💼" },
      { href: "/dashboard/watchlist", label: "Watchlist", icon: "👀" },
      { href: "/dashboard/alerts", label: "Alerts", icon: "🔔" },
      { href: "/dashboard/auto-trade", label: "Auto Trade", icon: "✨" },
      { href: "/dashboard/pre-trade", label: "Pre-Trade Check", icon: "✅" },
      { href: "/dashboard/trade-plan", label: "AI Trade Plan", icon: "🎯" },
      { href: "/dashboard/exit-planner", label: "Exit Planner", icon: "🪜" },
      { href: "/dashboard/trailing-stop", label: "Trailing Stop", icon: "📉" },
    ],
  },
  {
    title: "Charts & Indicators",
    emoji: "📉",
    items: [
      { href: "/dashboard/charts", label: "Charts", icon: "📉" },
      { href: "/dashboard/symbol-compare", label: "Symbol Compare", icon: "📊" },
      { href: "/dashboard/indicators", label: "Indicators", icon: "📊" },
      { href: "/dashboard/mtf", label: "Multi-Timeframe", icon: "📺" },
      { href: "/dashboard/anchored-vwap", label: "Anchored VWAP", icon: "⚓" },
      { href: "/dashboard/volume-profile", label: "Volume Profile", icon: "📊" },
      { href: "/dashboard/macd-divergence", label: "MACD Divergence", icon: "📐" },
      { href: "/dashboard/ichimoku", label: "Ichimoku", icon: "☁️" },
      { href: "/dashboard/levels", label: "Pivots & Fib", icon: "📐" },
    ],
  },
  {
    title: "Scanners",
    emoji: "🔭",
    items: [
      { href: "/dashboard/scanner", label: "Scanner", icon: "🔍" },
      { href: "/dashboard/scanners", label: "Market Scanners", icon: "🔭" },
      { href: "/dashboard/scan-52w", label: "52w Scanner", icon: "🎯" },
      { href: "/dashboard/movers", label: "Top Movers", icon: "🚀" },
      { href: "/dashboard/gap-scan", label: "Gap Scanner", icon: "⏰" },
      { href: "/dashboard/strength-meter", label: "Strength Meter", icon: "💪" },
      { href: "/dashboard/donchian", label: "Donchian Breakout", icon: "🐢" },
      { href: "/dashboard/sharpe-screener", label: "Sharpe Screener", icon: "📊" },
      { href: "/dashboard/heatmap", label: "Heatmap", icon: "🗺" },
      { href: "/dashboard/earnings", label: "Earnings", icon: "📊" },
      { href: "/dashboard/sectors", label: "Sector RRG", icon: "🔄" },
      { href: "/dashboard/seasonality", label: "Seasonality", icon: "🌀" },
    ],
  },
  {
    title: "Macro & Sentiment",
    emoji: "🏛",
    items: [
      { href: "/dashboard/news", label: "News + AI", icon: "📰" },
      { href: "/dashboard/macro", label: "Macro", icon: "🏛" },
      { href: "/dashboard/economy", label: "Economy", icon: "🏦" },
      { href: "/dashboard/yield-curve", label: "Yield Curve", icon: "📐" },
      { href: "/dashboard/buffett", label: "Buffett", icon: "📏" },
      { href: "/dashboard/liquidity", label: "Net Liquidity", icon: "💧" },
      { href: "/dashboard/vix-term", label: "VIX Term", icon: "📊" },
      { href: "/dashboard/sentiment", label: "Sentiment", icon: "😱" },
      { href: "/dashboard/onchain", label: "On-Chain", icon: "⛓" },
      { href: "/dashboard/crypto-ratios", label: "Crypto Ratios", icon: "🪙" },
      { href: "/dashboard/cot", label: "COT", icon: "📋" },
      { href: "/dashboard/insider", label: "Insider", icon: "🕵" },
      { href: "/dashboard/moon", label: "Moon & Gann", icon: "🌙" },
      { href: "/dashboard/calendar", label: "Calendar", icon: "📅" },
      { href: "/dashboard/risk-regime", label: "Risk On/Off", icon: "🌡️" },
      { href: "/dashboard/market-breadth", label: "Market Breadth", icon: "🫁" },
    ],
  },
  {
    title: "Risk & Sizing",
    emoji: "📐",
    items: [
      { href: "/dashboard/position-size", label: "Position Size", icon: "📏" },
      { href: "/dashboard/atr-sizer", label: "ATR Sizer", icon: "📏" },
      { href: "/dashboard/kelly", label: "Kelly Criterion", icon: "📐" },
      { href: "/dashboard/risk-metrics", label: "Risk Metrics", icon: "📐" },
      { href: "/dashboard/concentration", label: "Concentration", icon: "🎯" },
      { href: "/dashboard/stress-test", label: "Stress Test", icon: "⚠️" },
      { href: "/dashboard/montecarlo", label: "Monte Carlo", icon: "🎲" },
      { href: "/dashboard/drawdown-recovery", label: "Drawdown Recovery", icon: "📉" },
      { href: "/dashboard/correlation", label: "Correlation", icon: "🔗" },
      { href: "/dashboard/multi-beta", label: "Multi-Beta", icon: "β" },
      { href: "/dashboard/beta", label: "Beta Calculator", icon: "β" },
      { href: "/dashboard/hurst", label: "Hurst Exponent", icon: "🔬" },
      { href: "/dashboard/trend-score", label: "Trend Score", icon: "📊" },
    ],
  },
  {
    title: "Portfolio Tools",
    emoji: "📈",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
      { href: "/dashboard/symbol-stats", label: "Symbol Stats", icon: "📊" },
      { href: "/dashboard/trade-stats", label: "Trade Stats", icon: "📈" },
      { href: "/dashboard/pnl-calendar", label: "P&L Calendar", icon: "📅" },
      { href: "/dashboard/trade-grades", label: "Trade Grader", icon: "🎓" },
      { href: "/dashboard/trade-replay", label: "Trade Replay", icon: "🎬" },
      { href: "/dashboard/tag-analytics", label: "Tag Analytics", icon: "🏷" },
      { href: "/dashboard/portfolio-qa", label: "Portfolio Q&A", icon: "💬" },
      { href: "/dashboard/portfolio-review", label: "AI Review", icon: "🧠" },
      { href: "/dashboard/frontier", label: "Efficient Frontier", icon: "📈" },
      { href: "/dashboard/risk-parity", label: "Risk Parity", icon: "⚖️" },
      { href: "/dashboard/tax-harvest", label: "Tax Harvest", icon: "🧾" },
      { href: "/dashboard/dca", label: "DCA Simulator", icon: "📅" },
    ],
  },
  {
    title: "Calculators",
    emoji: "🧮",
    items: [
      { href: "/dashboard/profit-calc", label: "Profit Calc", icon: "💰" },
      { href: "/dashboard/options-pricer", label: "Options Pricer", icon: "🧮" },
      { href: "/dashboard/options-payoff", label: "Options Payoff", icon: "📈" },
      { href: "/dashboard/implied-move", label: "Implied Move", icon: "🎯" },
      { href: "/dashboard/vol-cone", label: "Volatility Cone", icon: "📊" },
      { href: "/dashboard/pairs-trade", label: "Pairs Trade", icon: "⚖️" },
      { href: "/dashboard/fx", label: "FX Converter", icon: "💱" },
    ],
  },
  {
    title: "Backtest",
    emoji: "🧪",
    items: [
      { href: "/dashboard/backtest", label: "Backtest", icon: "🧪" },
      { href: "/dashboard/backtest-compare", label: "Backtest Compare", icon: "⚔️" },
      { href: "/dashboard/strategy-builder", label: "Strategy Builder", icon: "🛠" },
      { href: "/dashboard/strategy-templates", label: "Strategy Templates", icon: "📚" },
    ],
  },
  {
    title: "AI & Agents",
    emoji: "🤖",
    items: [
      { href: "/dashboard/agents", label: "Agents", icon: "🤖" },
      { href: "/dashboard/journal", label: "Journal", icon: "📓" },
      { href: "/dashboard/journal-summary", label: "Journal AI", icon: "🧠" },
    ],
  },
  {
    title: "Community",
    emoji: "🏆",
    items: [
      { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
      { href: "/tournaments", label: "Tournaments", icon: "🥇" },
      { href: "/feed", label: "Feed", icon: "📰" },
      { href: "/dashboard/referrals", label: "Refer & Earn", icon: "🎁" },
    ],
  },
  {
    title: "Account",
    emoji: "⚙️",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
      { href: "/dashboard/api-keys", label: "API Keys", icon: "🔑" },
      { href: "/dashboard/webhooks", label: "Webhooks", icon: "📡" },
      { href: "/dashboard/export", label: "Export CSV", icon: "📤" },
      { href: "/dashboard/system-health", label: "System Health", icon: "🩺" },
      { href: "/dashboard/demo", label: "Demo Data", icon: "🎮" },
      { href: "/guide", label: "Guide", icon: "📖" },
    ],
  },
];

const allItems: NavItem[] = groups.flatMap((g) => g.items);

const FAV_KEY = "elexa_sidebar_favs";
const COLLAPSE_KEY = "elexa_sidebar_collapsed";

export default function DashboardSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    try {
      const f = localStorage.getItem(FAV_KEY);
      if (f) setFavs(JSON.parse(f));
      const c = localStorage.getItem(COLLAPSE_KEY);
      if (c) setCollapsed(JSON.parse(c));
    } catch { /* ignore */ }
  }, []);

  function toggleFav(href: string) {
    const next = favs.includes(href) ? favs.filter((h) => h !== href) : [...favs, href];
    setFavs(next);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function toggleGroup(title: string) {
    const next = collapsed.includes(title) ? collapsed.filter((t) => t !== title) : [...collapsed, title];
    setCollapsed(next);
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const favItems = allItems.filter((i) => favs.includes(i.href));
  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;
  const matchesSearch = (i: NavItem) => i.label.toLowerCase().includes(q);

  return (
    <>
      <div className="md:hidden flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3 bg-[var(--card)] sticky top-0 z-30">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-[var(--background)]" aria-label="Open menu">☰</button>
        <Link href="/" className="font-bold text-indigo-400">Elexa AI</Link>
        <div className="w-9" />
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}

      <aside className={`
        md:w-60 md:border-r md:border-[var(--card-border)] md:bg-[var(--card)]
        md:flex md:flex-col md:p-4 md:shrink-0 md:static md:translate-x-0
        fixed inset-y-0 left-0 w-72 bg-[var(--card)] border-r border-[var(--card-border)]
        p-4 flex flex-col z-50 transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-lg font-bold text-indigo-400 block px-2">Elexa AI</Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-[var(--background)] text-[var(--muted)]" aria-label="Close menu">✕</button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm mb-4"
        />

        <div className="mb-4 px-2 py-1.5 bg-amber-950 border border-amber-800 rounded-lg text-amber-300 text-xs text-center">
          📄 Paper Trading Mode
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {!isSearching && favItems.length > 0 && (
            <>
              <p className="text-[10px] uppercase text-[var(--muted)] px-3 pt-1 pb-1">⭐ Pinned</p>
              {favItems.map((item) => (
                <NavRow key={`fav-${item.href}`} item={item} pathname={pathname} favs={favs} onToggleFav={toggleFav} />
              ))}
              <div className="border-t border-[var(--card-border)] my-2" />
            </>
          )}

          {groups.map((g) => {
            const visibleItems = isSearching ? g.items.filter(matchesSearch) : g.items;
            if (isSearching && visibleItems.length === 0) return null;
            const isCollapsed = !isSearching && collapsed.includes(g.title);
            return (
              <div key={g.title} className="mt-2">
                <button
                  onClick={() => toggleGroup(g.title)}
                  className="w-full flex items-center justify-between text-[10px] uppercase tracking-wide text-[var(--muted)] hover:text-white px-3 pt-2 pb-1"
                >
                  <span>{g.emoji} {g.title}</span>
                  <span>{isCollapsed ? "▸" : "▾"}</span>
                </button>
                {(isSearching || !isCollapsed) && visibleItems.map((item) => (
                  <NavRow key={item.href} item={item} pathname={pathname} favs={favs} onToggleFav={toggleFav} />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--card-border)] pt-4 mt-4">
          <p className="text-xs text-[var(--muted)] px-2 mb-3 truncate">{email}</p>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left text-xs text-[var(--muted)] hover:text-white px-2 py-1.5 rounded transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function NavRow({ item, pathname, favs, onToggleFav }: {
  item: NavItem; pathname: string; favs: string[]; onToggleFav: (h: string) => void;
}) {
  const active = pathname === item.href;
  const isFav = favs.includes(item.href);
  return (
    <div className="group flex items-center">
      <Link
        href={item.href}
        className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          active ? "bg-indigo-600 text-white" : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-white"
        }`}
      >
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </Link>
      <button
        onClick={() => onToggleFav(item.href)}
        className={`px-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
          isFav ? "text-amber-400 opacity-100" : "text-[var(--muted)] hover:text-amber-400"
        }`}
        title={isFav ? "Unpin" : "Pin to top"}
      >
        {isFav ? "★" : "☆"}
      </button>
    </div>
  );
}
