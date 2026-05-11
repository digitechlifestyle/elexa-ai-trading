import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE", "ADA", "ARB", "AVAX", "BAT", "BCH", "BONK", "BTC", "CRV",
  "DOGE", "DOT", "ETH", "FIL", "GRT", "HYPE", "LDO", "LINK", "LTC",
  "ONDO", "PAXG", "PEPE", "POL", "RENDER", "SHIB", "SKY", "SOL",
  "SUSHI", "TRUMP", "UNI", "USDC", "USDG", "USDT", "WIF", "XRP",
  "XTZ", "YFI",
]);

function isCrypto(sym: string) {
  if (sym.includes("/")) return true;
  return ALPACA_CRYPTO_SYMBOLS.has(sym.toUpperCase());
}

function normalize(sym: string) {
  const u = sym.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

/**
 * GET /api/trading/bars?symbol=AAPL&days=30
 * Returns: { bars: [{ t: ISO, c: close, o: open, h: high, l: low, v: volume }] }
 */
export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  const days = Math.max(
    1,
    Math.min(365, Number(url.searchParams.get("days") || 30))
  );

  if (!symbol || !/^[A-Z0-9./-]{1,12}$/.test(symbol.toUpperCase())) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }

  const apiKey = process.env.ALPACA_API_KEY || "";
  const apiSecret = process.env.ALPACA_API_SECRET || "";
  const headers = {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": apiSecret,
  };

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  const sym = normalize(symbol);
  let endpoint: string;
  if (isCrypto(symbol)) {
    endpoint = `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(
      sym
    )}&timeframe=1Day&start=${startStr}&end=${endStr}&limit=400`;
  } else {
    endpoint = `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${startStr}&end=${endStr}&limit=400&adjustment=split`;
  }

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return NextResponse.json(
      {
        error: "Could not fetch bars",
        detail: txt.slice(0, 200),
      },
      { status: 502 }
    );
  }
  const data = await res.json();

  // Stock response: { bars: [...] }. Crypto: { bars: { "BTC/USD": [...] } }.
  let bars: Array<{
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  }> = [];
  if (isCrypto(symbol)) {
    bars = data?.bars?.[sym] ?? [];
  } else {
    bars = data?.bars ?? [];
  }

  return NextResponse.json({ symbol: sym, bars });
});
