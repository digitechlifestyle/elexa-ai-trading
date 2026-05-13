import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { h: number; l: number; c: number; v: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, days = 90, bins = 30 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars?.length) return NextResponse.json({ error: "No bars" }, { status: 422 });

  const lows = (bars as Bar[]).map((b) => b.l);
  const highs = (bars as Bar[]).map((b) => b.h);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min;
  if (range <= 0) return NextResponse.json({ error: "No price range" }, { status: 422 });

  const binSize = range / bins;
  const buckets = new Array(bins).fill(0);

  // Distribute each bar's volume proportionally across price bins it touches
  for (const b of bars as Bar[]) {
    const barRange = b.h - b.l;
    if (barRange <= 0) {
      const idx = Math.min(bins - 1, Math.floor((b.c - min) / binSize));
      buckets[idx] += b.v;
      continue;
    }
    const startBin = Math.floor((b.l - min) / binSize);
    const endBin = Math.min(bins - 1, Math.floor((b.h - min) / binSize));
    const span = endBin - startBin + 1;
    const vPerBin = b.v / span;
    for (let i = startBin; i <= endBin; i++) buckets[i] += vPerBin;
  }

  const profile = buckets.map((v, i) => ({
    price_low: min + i * binSize,
    price_high: min + (i + 1) * binSize,
    price_mid: min + (i + 0.5) * binSize,
    volume: v,
  }));

  // POC = bin with max volume
  const poc = profile.reduce((a, b) => (b.volume > a.volume ? b : a), profile[0]);

  // Value area = 70% of total volume around POC
  const totalV = profile.reduce((s, p) => s + p.volume, 0);
  const target = totalV * 0.7;
  const pocIdx = profile.indexOf(poc);
  let lo = pocIdx, hi = pocIdx, acc = poc.volume;
  while (acc < target && (lo > 0 || hi < profile.length - 1)) {
    const upV = hi < profile.length - 1 ? profile[hi + 1].volume : -1;
    const dnV = lo > 0 ? profile[lo - 1].volume : -1;
    if (upV >= dnV && hi < profile.length - 1) { hi++; acc += profile[hi].volume; }
    else if (lo > 0) { lo--; acc += profile[lo].volume; }
    else break;
  }
  const vah = profile[hi].price_high;
  const val = profile[lo].price_low;

  return NextResponse.json({
    symbol,
    current_price: (bars as Bar[])[bars.length - 1].c,
    poc: poc.price_mid,
    value_area_high: vah,
    value_area_low: val,
    profile,
  });
});
