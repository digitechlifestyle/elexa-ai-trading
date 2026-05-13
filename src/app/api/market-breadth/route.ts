import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

interface Bar { t: string; c: number; }

// S&P 100 proxy (top large caps, easy to fetch)
const UNIVERSE = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK.B","UNH","JPM",
  "V","XOM","JNJ","WMT","MA","PG","HD","CVX","LLY","ABBV",
  "MRK","PEP","KO","BAC","ORCL","COST","AVGO","TMO","CSCO","ACN",
  "MCD","WFC","ABT","CRM","ADBE","DHR","NKE","NEE","CMCSA","PFE",
  "TXN","NFLX","INTC","T","DIS","VZ","AMD","IBM","QCOM","INTU",
];

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const s = values.slice(-period).reduce((a, b) => a + b, 0);
  return s / period;
}

export const GET = withApi(async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") || "";

  type Row = {
    symbol: string; price: number | null; change_pct: number | null;
    above50: boolean | null; above200: boolean | null;
  };

  const rows: Row[] = await Promise.all(
    UNIVERSE.map(async (sym) => {
      try {
        const r = await fetch(`${origin}/api/trading/bars?symbol=${sym}&days=250`, { headers: { cookie } });
        if (!r.ok) return { symbol: sym, price: null, change_pct: null, above50: null, above200: null };
        const j = await r.json();
        const bars: Bar[] = j.bars ?? [];
        if (bars.length < 2) return { symbol: sym, price: null, change_pct: null, above50: null, above200: null };
        const last = bars[bars.length - 1].c;
        const prev = bars[bars.length - 2].c;
        const ch = ((last - prev) / prev) * 100;
        const closes = bars.map((b) => b.c);
        const m50 = sma(closes, 50);
        const m200 = sma(closes, 200);
        return {
          symbol: sym,
          price: last,
          change_pct: ch,
          above50: m50 != null ? last > m50 : null,
          above200: m200 != null ? last > m200 : null,
        };
      } catch {
        return { symbol: sym, price: null, change_pct: null, above50: null, above200: null };
      }
    })
  );

  const valid = rows.filter((r) => r.change_pct != null);
  const advancers = valid.filter((r) => (r.change_pct ?? 0) > 0).length;
  const decliners = valid.filter((r) => (r.change_pct ?? 0) < 0).length;
  const unchanged = valid.length - advancers - decliners;
  const above50 = rows.filter((r) => r.above50 === true).length;
  const above200 = rows.filter((r) => r.above200 === true).length;
  const validMA50 = rows.filter((r) => r.above50 != null).length || 1;
  const validMA200 = rows.filter((r) => r.above200 != null).length || 1;

  return NextResponse.json({
    advancers, decliners, unchanged,
    ad_ratio: decliners === 0 ? null : advancers / decliners,
    pct_above_50: (above50 / validMA50) * 100,
    pct_above_200: (above200 / validMA200) * 100,
    universe_size: UNIVERSE.length,
    rows: rows.sort((a, b) => (b.change_pct ?? -999) - (a.change_pct ?? -999)),
  });
});
