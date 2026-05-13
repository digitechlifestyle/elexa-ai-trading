import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

/**
 * Historical stress scenarios — actual market shocks applied to user's positions.
 *
 * For each scenario, we apply a hardcoded set of broad shocks to user's
 * positions matched by their broad asset class (equity / bond / commodity / crypto).
 *
 * This is an approximation — a real shop would use covariance-based VAR.
 */

interface Scenario {
  id: string;
  name: string;
  description: string;
  shocks: {
    equity: number; // % shock
    bond: number;
    gold: number;
    oil: number;
    crypto: number;
    dollar: number;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "2008",
    name: "2008 GFC (Sep–Nov 2008)",
    description: "Lehman collapse, credit freeze, broad rout",
    shocks: { equity: -38, bond: 8, gold: -10, oil: -55, crypto: 0, dollar: 12 },
  },
  {
    id: "covid",
    name: "COVID crash (Feb–Mar 2020)",
    description: "Pandemic shock, fastest 30% drop in S&P history",
    shocks: { equity: -34, bond: 5, gold: 2, oil: -65, crypto: -50, dollar: 8 },
  },
  {
    id: "2022",
    name: "2022 rates shock (Jan–Oct)",
    description: "Fed tightening, growth selloff, crypto winter",
    shocks: { equity: -25, bond: -15, gold: -8, oil: 35, crypto: -75, dollar: 17 },
  },
  {
    id: "dotcom",
    name: "Dot-com bust (2000–02)",
    description: "Tech-led 49% S&P drawdown over 30 months",
    shocks: { equity: -49, bond: 25, gold: 5, oil: -30, crypto: 0, dollar: -5 },
  },
  {
    id: "flash_crash",
    name: "Flash crash (May 6, 2010)",
    description: "Intraday 9% drop and recovery in 36 minutes",
    shocks: { equity: -9, bond: 1, gold: 0, oil: -5, crypto: 0, dollar: 1 },
  },
  {
    id: "rate_hike_shock",
    name: "Sudden +100bp rate hike",
    description: "Hypothetical surprise rate move",
    shocks: { equity: -8, bond: -10, gold: -5, oil: -3, crypto: -15, dollar: 4 },
  },
];

const CRYPTO_SYMBOLS = new Set([
  "BTC","ETH","SOL","XRP","DOGE","SHIB","PEPE","AAVE","ADA","ARB","AVAX",
  "BCH","BONK","CRV","DOT","FIL","GRT","LDO","LINK","LTC","MATIC","ONDO",
  "PAXG","POL","RENDER","SKY","SUSHI","TRUMP","UNI","USDC","USDG","USDT",
  "WIF","XLM","HBAR","ATOM","ALGO","ICP","NEAR","KAVA","XTZ","YFI","BAT",
  "HYPE",
]);
const BOND_ETFS = new Set(["TLT", "IEF", "SHY", "BND", "AGG", "HYG", "LQD"]);
const GOLD_ETFS = new Set(["GLD", "IAU", "SGOL", "PAXG"]);
const OIL_ETFS = new Set(["USO", "BNO", "UNG", "XLE"]);
const DOLLAR_ETFS = new Set(["UUP"]);

function classify(symbol: string): keyof Scenario["shocks"] {
  const s = symbol.toUpperCase();
  if (CRYPTO_SYMBOLS.has(s) || s.includes("/")) return "crypto";
  if (BOND_ETFS.has(s)) return "bond";
  if (GOLD_ETFS.has(s)) return "gold";
  if (OIL_ETFS.has(s)) return "oil";
  if (DOLLAR_ETFS.has(s)) return "dollar";
  return "equity"; // default
}

export const POST = withApi(async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("symbol, side, qty, filled_price, status")
    .eq("user_id", user.id)
    .eq("status", "filled");
  if (!trades || trades.length === 0) {
    return NextResponse.json({
      empty: true,
      message: "No filled trades. Stress test needs at least one position.",
    });
  }

  // Aggregate positions
  const positions = new Map<string, { qty: number; cost: number }>();
  for (const t of trades) {
    const cur = positions.get(t.symbol) ?? { qty: 0, cost: 0 };
    const sign = t.side === "buy" ? 1 : -1;
    cur.qty += sign * Number(t.qty);
    cur.cost += sign * Number(t.qty) * Number(t.filled_price ?? 0);
    positions.set(t.symbol, cur);
  }
  const holdings = Array.from(positions.entries())
    .filter(([, p]) => Math.abs(p.qty) > 1e-9)
    .map(([symbol, p]) => {
      const avg = Math.abs(p.cost) / Math.abs(p.qty);
      const value = Math.abs(p.qty) * avg; // cost basis as value baseline
      return {
        symbol,
        qty: p.qty,
        value,
        class: classify(symbol),
      };
    });
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);

  // Apply each scenario
  const results = SCENARIOS.map((s) => {
    const breakdown = holdings.map((h) => {
      const shock = s.shocks[h.class] ?? 0;
      const newValue = h.value * (1 + shock / 100);
      return {
        symbol: h.symbol,
        class: h.class,
        old_value: h.value,
        new_value: newValue,
        shock_pct: shock,
        pnl: newValue - h.value,
      };
    });
    const totalPnl = breakdown.reduce((sum, b) => sum + b.pnl, 0);
    const newTotal = breakdown.reduce((sum, b) => sum + b.new_value, 0);
    return {
      scenario: s,
      total_pnl: totalPnl,
      new_total: newTotal,
      pnl_pct: totalValue > 0 ? (totalPnl / totalValue) * 100 : 0,
      breakdown,
    };
  });

  return NextResponse.json({
    holdings,
    total_value: totalValue,
    scenarios: results.sort((a, b) => a.pnl_pct - b.pnl_pct),
  });
});
