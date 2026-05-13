import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// Liquid universe — large caps + popular names
const UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO",
  "ORCL", "AMD", "INTC", "CRM", "ADBE", "NFLX", "CSCO", "QCOM",
  "PLTR", "COIN", "SHOP", "UBER", "ABNB", "SNOW", "MDB", "DELL",
  "JPM", "BAC", "GS", "MS", "WFC", "C", "BLK",
  "JNJ", "PFE", "LLY", "UNH", "MRK", "ABBV",
  "WMT", "COST", "TGT", "HD", "NKE", "MCD", "SBUX",
  "DIS", "TMUS", "VZ", "T",
  "XOM", "CVX", "COP",
  "BA", "CAT", "GE", "F", "GM",
  "SPY", "QQQ", "IWM", "DIA",
  "BTC", "ETH", "SOL", "DOGE", "XRP", "GLD", "SLV", "USO",
];

const ALPACA_CRYPTO = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);

interface Mover {
  symbol: string;
  current: number;
  prev_close: number;
  change_pct: number;
  volume: number;
}

async function fetchTwoBars(symbol: string): Promise<Mover | null> {
  const isCrypto = ALPACA_CRYPTO.has(symbol);
  const sym = isCrypto ? `${symbol}/USD` : symbol;
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400 * 1000);
  const url = isCrypto
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=5`
    : `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=5&adjustment=split`;
  try {
    const res = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
        "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const bars: { c: number; v: number }[] = isCrypto
      ? data?.bars?.[sym] ?? []
      : data?.bars ?? [];
    if (bars.length < 2) return null;
    const last = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    return {
      symbol,
      current: last.c,
      prev_close: prev.c,
      change_pct: ((last.c - prev.c) / prev.c) * 100,
      volume: last.v,
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

  const movers: Mover[] = [];
  await Promise.all(
    UNIVERSE.map(async (s) => {
      const m = await fetchTwoBars(s);
      if (m && Number.isFinite(m.change_pct)) movers.push(m);
    })
  );

  movers.sort((a, b) => b.change_pct - a.change_pct);
  return NextResponse.json({
    gainers: movers.slice(0, 15),
    losers: movers.slice(-15).reverse(),
    all: movers,
  });
});
