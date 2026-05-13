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

async function fetchBars(symbol: string, days: number): Promise<{ t: string; h: number; l: number; c: number }[]> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=1000`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=1000&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const bars = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  return bars as { t: string; h: number; l: number; c: number }[];
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
  if (!body || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbol = body.symbol.toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const days = Math.max(30, Math.min(365, Number(body.days) || 180));
  const trailPct = Math.max(0.1, Math.min(50, Number(body.trail_pct) || 5));
  const trailDollar = Number.isFinite(body.trail_dollar) && body.trail_dollar > 0
    ? Number(body.trail_dollar)
    : null;
  const side = body.side === "short" ? "short" : "long";

  const bars = await fetchBars(symbol, days);
  if (bars.length < 20) {
    return NextResponse.json({ error: "Insufficient history" }, { status: 422 });
  }

  const entry = bars[0].c;
  let peakOrTrough = side === "long" ? bars[0].h : bars[0].l;
  let stop =
    side === "long"
      ? trailDollar != null
        ? peakOrTrough - trailDollar
        : peakOrTrough * (1 - trailPct / 100)
      : trailDollar != null
      ? peakOrTrough + trailDollar
      : peakOrTrough * (1 + trailPct / 100);
  let exit: { date: string; price: number } | null = null;

  const series: { date: string; close: number; stop: number; hit: boolean }[] = [];

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (side === "long") {
      if (b.h > peakOrTrough) peakOrTrough = b.h;
      const newStop =
        trailDollar != null
          ? peakOrTrough - trailDollar
          : peakOrTrough * (1 - trailPct / 100);
      if (newStop > stop) stop = newStop;
      // Check if low pierced stop today
      const hit = exit === null && b.l <= stop;
      if (hit && exit === null) {
        exit = { date: b.t, price: stop };
      }
      series.push({ date: b.t, close: b.c, stop, hit });
    } else {
      if (b.l < peakOrTrough) peakOrTrough = b.l;
      const newStop =
        trailDollar != null
          ? peakOrTrough + trailDollar
          : peakOrTrough * (1 + trailPct / 100);
      if (newStop < stop) stop = newStop;
      const hit = exit === null && b.h >= stop;
      if (hit && exit === null) {
        exit = { date: b.t, price: stop };
      }
      series.push({ date: b.t, close: b.c, stop, hit });
    }
  }

  const lastClose = bars[bars.length - 1].c;
  const finalPrice = exit?.price ?? lastClose;
  const pnlPerShare =
    side === "long" ? finalPrice - entry : entry - finalPrice;
  const pnlPct = (pnlPerShare / entry) * 100;
  const maxFavourable =
    side === "long" ? peakOrTrough - entry : entry - peakOrTrough;
  const maxFavourablePct = (maxFavourable / entry) * 100;

  return NextResponse.json({
    symbol,
    side,
    days,
    trail_pct: trailPct,
    trail_dollar: trailDollar,
    entry,
    final_price: finalPrice,
    pnl_per_share: pnlPerShare,
    pnl_pct: pnlPct,
    max_favourable_pct: maxFavourablePct,
    exit,
    series,
  });
});
