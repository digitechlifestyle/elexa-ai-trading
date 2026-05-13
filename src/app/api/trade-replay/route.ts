import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);
function isCrypto(s: string) { return s.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(s.toUpperCase()); }
function normalize(s: string) {
  const u = s.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }

  // Fetch user's trades on this symbol
  const { data: trades } = await supabase
    .from("trades")
    .select("id, symbol, side, qty, filled_price, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "filled")
    .eq("symbol", symbol)
    .order("created_at", { ascending: true });
  if (!trades || trades.length === 0) {
    return NextResponse.json({ symbol, trades: [], bars: [] });
  }

  // Fetch bars covering range
  const first = new Date(trades[0].created_at);
  const last = new Date(trades[trades.length - 1].created_at);
  const start = new Date(first.getTime() - 14 * 86400 * 1000);
  const end = new Date(Math.max(last.getTime() + 14 * 86400 * 1000, Date.now()));
  const sym = normalize(symbol);
  const barsUrl = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;

  let bars: { t: string; c: number }[] = [];
  try {
    const res = await fetch(barsUrl, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
        "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const raw = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
      bars = raw as { t: string; c: number }[];
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    symbol,
    trades: trades.map((t) => ({
      id: t.id,
      side: t.side,
      qty: Number(t.qty),
      price: Number(t.filled_price ?? 0),
      date: t.created_at,
    })),
    bars,
  });
});
