import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbols, days = 180 } = await request.json();
  if (!Array.isArray(symbols) || symbols.length < 2 || symbols.length > 6) {
    return NextResponse.json({ error: "2-6 symbols required" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  const seriesArr = await Promise.all(symbols.map(async (s: string) => {
    const sym = s.toUpperCase().trim();
    try {
      const r = await fetch(`${origin}/api/trading/bars?symbol=${encodeURIComponent(sym)}&days=${days}`, { headers: { cookie } });
      if (!r.ok) return { symbol: sym, bars: [] as Bar[] };
      const j = await r.json();
      return { symbol: sym, bars: (j.bars ?? []) as Bar[] };
    } catch {
      return { symbol: sym, bars: [] as Bar[] };
    }
  }));

  // Normalise each to 100 at first bar, then merge by date
  const allDates = new Set<string>();
  const normalised: Record<string, Record<string, number>> = {};
  for (const { symbol, bars } of seriesArr) {
    if (bars.length === 0) continue;
    const base = bars[0].c;
    normalised[symbol] = {};
    for (const b of bars) {
      const d = b.t.slice(0, 10);
      normalised[symbol][d] = (b.c / base) * 100;
      allDates.add(d);
    }
  }

  const sortedDates = Array.from(allDates).sort();
  const merged = sortedDates.map((d) => {
    const row: Record<string, number | string> = { date: d };
    for (const sym of Object.keys(normalised)) {
      if (normalised[sym][d] != null) row[sym] = normalised[sym][d];
    }
    return row;
  });

  // Summary: total return per symbol
  const summary = seriesArr.map(({ symbol, bars }) => ({
    symbol,
    return_pct: bars.length >= 2 ? ((bars[bars.length - 1].c - bars[0].c) / bars[0].c) * 100 : 0,
    bars: bars.length,
  }));

  return NextResponse.json({ series: merged, summary, symbols: Object.keys(normalised) });
});
