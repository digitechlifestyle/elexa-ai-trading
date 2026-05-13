import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; o: number; h: number; l: number; c: number; v: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, anchor_date, days = 180 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const barsRes = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!barsRes.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await barsRes.json();
  if (!bars?.length) return NextResponse.json({ error: "No bars" }, { status: 422 });

  const anchorIdx = anchor_date
    ? (bars as Bar[]).findIndex((b) => b.t.slice(0, 10) >= anchor_date)
    : 0;
  const startIdx = anchorIdx >= 0 ? anchorIdx : 0;

  let cumPV = 0;
  let cumV = 0;
  const series = (bars as Bar[]).map((b, i) => {
    const typical = (b.h + b.l + b.c) / 3;
    if (i >= startIdx) {
      cumPV += typical * b.v;
      cumV += b.v;
    }
    return {
      date: b.t.slice(0, 10),
      price: b.c,
      vwap: i >= startIdx && cumV > 0 ? cumPV / cumV : null,
    };
  });

  const last = series[series.length - 1];
  const vwap = last.vwap;
  const dev = vwap ? ((last.price - vwap) / vwap) * 100 : null;

  return NextResponse.json({
    symbol,
    anchor_date: (bars as Bar[])[startIdx]?.t.slice(0, 10),
    current_price: last.price,
    current_vwap: vwap,
    deviation_pct: dev,
    series,
  });
});
