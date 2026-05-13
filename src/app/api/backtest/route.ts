import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import {
  runBacktest,
  STRATEGIES,
  type StrategyId,
  type BacktestResult,
} from "@/lib/backtest/strategies";
import {
  runCustomStrategy,
  type CustomStrategyConfig,
} from "@/lib/backtest/custom-strategy";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);

function isCrypto(sym: string) {
  return sym.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(sym.toUpperCase());
}

function normalize(sym: string) {
  const u = sym.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.symbol !== "string" || typeof body.strategy !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const isCustom = body.strategy === "custom";
  if (!isCustom && !(body.strategy in STRATEGIES)) {
    return NextResponse.json({ error: "Unknown strategy" }, { status: 400 });
  }
  if (isCustom && !body.custom_config) {
    return NextResponse.json(
      { error: "custom_config required for custom strategy" },
      { status: 400 }
    );
  }
  const days = Math.max(30, Math.min(365, Number(body.days) || 180));
  const starting_cash = Math.max(100, Math.min(1_000_000, Number(body.starting_cash) || 10000));
  const symbol = body.symbol;
  const sym = normalize(symbol);

  // Fetch bars
  const apiKey = process.env.ALPACA_API_KEY ?? "";
  const apiSecret = process.env.ALPACA_API_SECRET ?? "";
  const headers = {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": apiSecret,
  };
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const endpoint = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch historical data" }, { status: 502 });
  }
  const data = await res.json();
  const bars = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];

  if (bars.length < 30) {
    return NextResponse.json(
      { error: `Not enough historical data for ${symbol} (got ${bars.length} bars, need 30+)` },
      { status: 422 }
    );
  }

  let result: BacktestResult;
  if (isCustom) {
    const cfg = body.custom_config as CustomStrategyConfig;
    // Validate config — defensive
    if (
      !cfg.buy_rule ||
      !cfg.sell_rule ||
      !Number.isInteger(cfg.sma_fast_period) ||
      !Number.isInteger(cfg.sma_slow_period) ||
      !Number.isInteger(cfg.rsi_period)
    ) {
      return NextResponse.json(
        { error: "Invalid custom_config" },
        { status: 400 }
      );
    }
    const trades = runCustomStrategy(bars, cfg);
    // Run through the same equity walker as the named strategies
    const { runBacktest: walkRun } = await import("@/lib/backtest/strategies");
    // Hijack by feeding through synthetic strategy
    // Simplest: replicate the equity walker inline
    let cash = starting_cash;
    let shares = 0;
    const equity_curve: { date: string; value: number }[] = [];
    let tradeIdx = 0;
    let entryPrice = 0;
    let wins = 0;
    let losses = 0;
    for (const bar of bars) {
      while (tradeIdx < trades.length && trades[tradeIdx].date === bar.t) {
        const t = trades[tradeIdx];
        if (t.side === "buy" && shares === 0) {
          shares = cash / t.price;
          entryPrice = t.price;
          cash = 0;
        } else if (t.side === "sell" && shares > 0) {
          cash = shares * t.price;
          if (t.price > entryPrice) wins++;
          else losses++;
          shares = 0;
        }
        tradeIdx++;
      }
      equity_curve.push({ date: bar.t, value: cash + shares * bar.c });
    }
    const finalValue =
      equity_curve[equity_curve.length - 1]?.value ?? starting_cash;
    const buyHoldFinal =
      bars.length > 1
        ? starting_cash * (bars[bars.length - 1].c / bars[0].c)
        : starting_cash;
    result = {
      strategy: "Custom Strategy",
      symbol: symbol.toUpperCase(),
      bars_count: bars.length,
      starting_cash,
      final_value: finalValue,
      final_pnl: finalValue - starting_cash,
      final_pnl_pct: ((finalValue - starting_cash) / starting_cash) * 100,
      trades,
      equity_curve,
      buy_hold_final: buyHoldFinal,
      buy_hold_pnl_pct: ((buyHoldFinal - starting_cash) / starting_cash) * 100,
      win_rate_pct: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      total_trades: trades.length,
    };
    // walkRun unused branch — keep import valid
    void walkRun;
  } else {
    result = runBacktest(
      body.strategy as StrategyId,
      symbol.toUpperCase(),
      bars,
      starting_cash
    );
  }
  return NextResponse.json({ result });
});
