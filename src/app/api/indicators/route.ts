import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { sma, ema, rsi, macd, bollinger, adx } from "@/lib/indicators";
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
  const symbol = (url.searchParams.get("symbol") || "SPY").toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const days = Math.max(60, Math.min(365, Number(url.searchParams.get("days")) || 180));

  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const apiUrl = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(apiUrl, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Couldn't fetch bars" }, { status: 502 });
  }
  const data = await res.json();
  const bars: { t: string; o: number; h: number; l: number; c: number }[] =
    isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  if (bars.length < 50) {
    return NextResponse.json({ error: "Insufficient bars" }, { status: 422 });
  }

  const closes = bars.map((b) => b.c);
  const highs = bars.map((b) => b.h);
  const lows = bars.map((b) => b.l);
  const ema20 = ema(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes, 14);
  const macdR = macd(closes);
  const bb = bollinger(closes, 20, 2);
  const adx14 = adx(highs, lows, closes, 14);

  // Build chart series
  const series = bars.map((b, i) => ({
    date: b.t,
    close: b.c,
    ema20: ema20[i],
    sma50: sma50[i],
    sma200: sma200[i],
    rsi: rsi14[i],
    macd: macdR.macd[i],
    macd_signal: macdR.signal[i],
    macd_hist: macdR.histogram[i],
    bb_upper: bb.upper[i],
    bb_lower: bb.lower[i],
    adx: adx14[i],
  }));

  const last = series[series.length - 1];
  const summary = {
    price: last.close,
    above_sma200:
      last.sma200 != null ? last.close > (last.sma200 as number) : null,
    above_sma50:
      last.sma50 != null ? last.close > (last.sma50 as number) : null,
    rsi: last.rsi,
    rsi_state:
      last.rsi == null
        ? null
        : last.rsi > 70
        ? "overbought"
        : last.rsi < 30
        ? "oversold"
        : "neutral",
    macd_bull: last.macd != null && last.macd_signal != null ? last.macd > last.macd_signal : null,
    adx: last.adx,
    adx_state:
      last.adx == null
        ? null
        : last.adx > 25
        ? "trending"
        : "ranging",
  };

  return NextResponse.json({ symbol, days, series, summary });
});
