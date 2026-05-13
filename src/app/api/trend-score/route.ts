import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";
import { sma, ema } from "@/lib/indicators";

interface Bar { c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 250 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars || bars.length < 200) {
    return NextResponse.json({ error: "Need at least 200 bars" }, { status: 422 });
  }

  const closes = (bars as Bar[]).map((b) => b.c);
  const price = closes[closes.length - 1];
  const ema20 = ema(closes, 20).at(-1)!;
  const sma50 = sma(closes, 50).at(-1)!;
  const sma100 = sma(closes, 100).at(-1)!;
  const sma200 = sma(closes, 200).at(-1)!;

  // Tests
  const tests = [
    { name: "Price > EMA20", pass: price > ema20 },
    { name: "Price > SMA50", pass: price > sma50 },
    { name: "Price > SMA100", pass: price > sma100 },
    { name: "Price > SMA200", pass: price > sma200 },
    { name: "EMA20 > SMA50", pass: ema20 > sma50 },
    { name: "SMA50 > SMA100", pass: sma50 > sma100 },
    { name: "SMA100 > SMA200", pass: sma100 > sma200 },
    { name: "SMA50 > SMA200 (golden cross state)", pass: sma50 > sma200 },
  ];

  const passed = tests.filter((t) => t.pass).length;
  const score = (passed / tests.length) * 2 - 1; // -1 to +1

  let label = "Neutral";
  let color = "text-amber-400";
  if (score >= 0.75) { label = "Strong uptrend"; color = "text-green-400"; }
  else if (score >= 0.25) { label = "Uptrend"; color = "text-green-300"; }
  else if (score <= -0.75) { label = "Strong downtrend"; color = "text-red-400"; }
  else if (score <= -0.25) { label = "Downtrend"; color = "text-red-300"; }

  return NextResponse.json({
    symbol, price, score, label, color, passed, total: tests.length, tests,
    ema20, sma50, sma100, sma200,
  });
});
