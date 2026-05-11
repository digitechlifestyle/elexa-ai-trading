import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { runBacktest, STRATEGIES, type StrategyId } from "@/lib/backtest/strategies";
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
  if (
    !body ||
    typeof body.symbol !== "string" ||
    typeof body.strategy !== "string" ||
    !(body.strategy in STRATEGIES)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
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

  const result = runBacktest(body.strategy as StrategyId, symbol.toUpperCase(), bars, starting_cash);
  return NextResponse.json({ result });
});
