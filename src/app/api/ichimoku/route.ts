import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { h: number; l: number; c: number; }

function high(bars: Bar[], n: number, idx: number): number {
  return Math.max(...bars.slice(idx - n + 1, idx + 1).map((b) => b.h));
}
function low(bars: Bar[], n: number, idx: number): number {
  return Math.min(...bars.slice(idx - n + 1, idx + 1).map((b) => b.l));
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=120`, { headers: { cookie: request.headers.get("cookie") || "" } });
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars || bars.length < 60) return NextResponse.json({ error: "Need 60+ bars" }, { status: 422 });

  const idx = bars.length - 1;
  // Tenkan (Conversion): (9-period high + 9-period low) / 2
  const tenkan = (high(bars, 9, idx) + low(bars, 9, idx)) / 2;
  // Kijun (Base): (26 high + 26 low) / 2
  const kijun = (high(bars, 26, idx) + low(bars, 26, idx)) / 2;
  // Senkou A (Leading A): (tenkan + kijun) / 2, plotted 26 ahead
  const senkouA = (tenkan + kijun) / 2;
  // Senkou B (Leading B): (52 high + 52 low) / 2, plotted 26 ahead
  const senkouB = (high(bars, 52, idx) + low(bars, 52, idx)) / 2;
  // Chikou (Lagging): close plotted 26 back — use current close
  const price = bars[idx].c;

  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  const cloudGreen = senkouA > senkouB;

  let signal = "Neutral";
  let color = "text-amber-400";
  if (price > cloudTop && tenkan > kijun && cloudGreen) {
    signal = "Strong bullish"; color = "text-green-400";
  } else if (price > cloudTop) {
    signal = "Bullish"; color = "text-green-300";
  } else if (price < cloudBottom && tenkan < kijun && !cloudGreen) {
    signal = "Strong bearish"; color = "text-red-400";
  } else if (price < cloudBottom) {
    signal = "Bearish"; color = "text-red-300";
  } else {
    signal = "Inside cloud (choppy)"; color = "text-amber-400";
  }

  return NextResponse.json({
    symbol, price, tenkan, kijun, senkou_a: senkouA, senkou_b: senkouB,
    cloud_top: cloudTop, cloud_bottom: cloudBottom, cloud_green: cloudGreen,
    signal, color,
  });
});
