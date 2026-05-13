import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { h: number; l: number; c: number; }

function atr(bars: Bar[], period: number): number | null {
  if (bars.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c),
    );
    trs.push(tr);
  }
  const last = trs.slice(-period);
  return last.reduce((a, b) => a + b, 0) / period;
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, period = 14, days = 90 } = await request.json();
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });

  const origin = request.nextUrl.origin;
  const r = await fetch(
    `${origin}/api/trading/bars?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    { headers: { cookie: request.headers.get("cookie") || "" } }
  );
  if (!r.ok) return NextResponse.json({ error: "Could not fetch bars" }, { status: 502 });
  const { bars } = await r.json();
  if (!bars?.length) return NextResponse.json({ error: "No bars" }, { status: 422 });

  const a = atr(bars as Bar[], period);
  const price = (bars as Bar[])[bars.length - 1].c;

  return NextResponse.json({
    symbol, period, atr: a, price,
    atr_pct: a != null ? (a / price) * 100 : null,
  });
});
