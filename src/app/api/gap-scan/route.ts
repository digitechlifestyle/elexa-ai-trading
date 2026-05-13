import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

const UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO",
  "ORCL", "AMD", "INTC", "CRM", "ADBE", "NFLX", "CSCO", "QCOM",
  "PLTR", "COIN", "SHOP", "UBER", "ABNB", "SNOW",
  "JPM", "BAC", "GS", "MS", "WFC",
  "JNJ", "PFE", "LLY", "UNH", "MRK",
  "WMT", "COST", "TGT", "HD", "NKE",
  "DIS", "TMUS", "BA", "CAT",
  "SPY", "QQQ", "IWM",
];

interface Gap {
  symbol: string;
  prev_close: number;
  current: number;
  gap_pct: number;
  intraday_chg_pct: number;
}

/**
 * Alpaca's latest bar reflects the most recent traded session for the
 * symbol. Combine latest trade price with the prior session close to surface
 * "gap" candidates (pre-market or open prints vs prior close).
 */
async function fetchGap(symbol: string): Promise<Gap | null> {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400 * 1000);
  const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=5&adjustment=split`;
  try {
    const [barsRes, latestRes] = await Promise.all([
      fetch(url, {
        headers: {
          "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
          "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
        },
      }),
      fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`, {
        headers: {
          "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
          "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
        },
      }),
    ]);
    if (!barsRes.ok || !latestRes.ok) return null;
    const barsData = await barsRes.json();
    const bars: { c: number; o: number }[] = barsData?.bars ?? [];
    if (bars.length < 2) return null;
    const prev = bars[bars.length - 2].c;
    const today = bars[bars.length - 1];
    const latestData = await latestRes.json();
    const last = Number(latestData?.trade?.p ?? today.c);
    const gap_pct = ((today.o - prev) / prev) * 100;
    const intraday_chg_pct = ((last - today.o) / today.o) * 100;
    return {
      symbol,
      prev_close: prev,
      current: last,
      gap_pct,
      intraday_chg_pct,
    };
  } catch {
    return null;
  }
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Gap[] = [];
  await Promise.all(
    UNIVERSE.map(async (s) => {
      const g = await fetchGap(s);
      if (g && Number.isFinite(g.gap_pct) && Math.abs(g.gap_pct) >= 0.2) {
        results.push(g);
      }
    })
  );

  results.sort((a, b) => Math.abs(b.gap_pct) - Math.abs(a.gap_pct));
  return NextResponse.json({
    gappers_up: results.filter((r) => r.gap_pct > 0).slice(0, 15),
    gappers_down: results.filter((r) => r.gap_pct < 0).slice(0, 15),
    all: results,
  });
});
