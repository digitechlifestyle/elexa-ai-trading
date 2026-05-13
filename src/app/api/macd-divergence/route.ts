import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { ema } from "@/lib/indicators";

interface Pivot {
  idx: number;
  price: number;
  macd: number;
}

interface Divergence {
  type: "bullish_regular" | "bearish_regular" | "bullish_hidden" | "bearish_hidden";
  from: { date: string; price: number; macd: number };
  to: { date: string; price: number; macd: number };
}

function findPivots(values: number[], lookback: number, mode: "high" | "low"): number[] {
  const idxs: number[] = [];
  for (let i = lookback; i < values.length - lookback; i++) {
    let isPivot = true;
    for (let j = 1; j <= lookback; j++) {
      if (mode === "high") {
        if (values[i] <= values[i - j] || values[i] <= values[i + j]) {
          isPivot = false;
          break;
        }
      } else {
        if (values[i] >= values[i - j] || values[i] >= values[i + j]) {
          isPivot = false;
          break;
        }
      }
    }
    if (isPivot) idxs.push(i);
  }
  return idxs;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 180 } = await request.json();
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }

  // Fetch bars via internal endpoint
  const origin = request.nextUrl.origin;
  const barsRes = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!barsRes.ok) {
    return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  }
  const { bars } = await barsRes.json();
  if (!bars || bars.length < 50) {
    return NextResponse.json({ error: "Not enough data" }, { status: 422 });
  }

  const closes = (bars as { c: number; t: string; h: number; l: number }[]).map((b) => b.c);
  const highs = bars.map((b: { h: number }) => b.h);
  const lows = bars.map((b: { l: number }) => b.l);
  const dates = bars.map((b: { t: string }) => b.t);

  // MACD = EMA12 - EMA26
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = closes.map((_, i) => (ema12[i] ?? 0) - (ema26[i] ?? 0));

  const lookback = 5;
  const priceHighs = findPivots(highs, lookback, "high");
  const priceLows = findPivots(lows, lookback, "low");

  const divergences: Divergence[] = [];

  // Bearish regular: price HH, MACD LH (at price-high pivots)
  for (let i = 1; i < priceHighs.length; i++) {
    const a = priceHighs[i - 1];
    const b = priceHighs[i];
    if (b - a < 5 || b - a > 60) continue;
    if (highs[b] > highs[a] && macd[b] < macd[a]) {
      divergences.push({
        type: "bearish_regular",
        from: { date: dates[a], price: highs[a], macd: macd[a] },
        to: { date: dates[b], price: highs[b], macd: macd[b] },
      });
    }
    // Hidden bearish: price LH, MACD HH (continuation in downtrend)
    if (highs[b] < highs[a] && macd[b] > macd[a]) {
      divergences.push({
        type: "bearish_hidden",
        from: { date: dates[a], price: highs[a], macd: macd[a] },
        to: { date: dates[b], price: highs[b], macd: macd[b] },
      });
    }
  }

  // Bullish regular: price LL, MACD HL
  for (let i = 1; i < priceLows.length; i++) {
    const a = priceLows[i - 1];
    const b = priceLows[i];
    if (b - a < 5 || b - a > 60) continue;
    if (lows[b] < lows[a] && macd[b] > macd[a]) {
      divergences.push({
        type: "bullish_regular",
        from: { date: dates[a], price: lows[a], macd: macd[a] },
        to: { date: dates[b], price: lows[b], macd: macd[b] },
      });
    }
    // Hidden bullish: price HL, MACD LL (continuation in uptrend)
    if (lows[b] > lows[a] && macd[b] < macd[a]) {
      divergences.push({
        type: "bullish_hidden",
        from: { date: dates[a], price: lows[a], macd: macd[a] },
        to: { date: dates[b], price: lows[b], macd: macd[b] },
      });
    }
  }

  // Sort by latest first
  divergences.sort((a, b) => (a.to.date < b.to.date ? 1 : -1));

  // Chart series
  const series = bars.map((b: { t: string; c: number }, i: number) => ({
    date: b.t.slice(0, 10),
    price: b.c,
    macd: macd[i],
  }));

  return NextResponse.json({
    symbol,
    divergences: divergences.slice(0, 20),
    series,
  });
});
