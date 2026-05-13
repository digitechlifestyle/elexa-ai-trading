import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);
function isCrypto(s: string) { return s.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(s.toUpperCase()); }
function normalize(s: string) {
  const u = s.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

interface Bar {
  t: string;
  c: number;
}

async function fetchBars(symbol: string, years: number): Promise<Bar[]> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - years * 365 * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=10000`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=10000&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const arr = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  return (arr as { t: string; c: number }[]).map((b) => ({ t: b.t, c: b.c }));
}

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbol = String(body.symbol ?? "").toUpperCase().trim();
  if (!/^[A-Z0-9./-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 422 });
  }
  const years = Math.max(1, Math.min(10, Number(body.years) || 5));
  const amountPerBuy = Math.max(1, Math.min(100_000, Number(body.amount) || 100));
  const cadence = body.cadence === "weekly" ? "weekly" : body.cadence === "biweekly" ? "biweekly" : "monthly";

  const bars = await fetchBars(symbol, years);
  if (bars.length < 30) {
    return NextResponse.json({ error: "Insufficient history" }, { status: 422 });
  }

  // Determine buy interval in days
  const interval = cadence === "weekly" ? 7 : cadence === "biweekly" ? 14 : 30;

  // Build equity curve. Each interval, buy $amount worth at that day's close.
  let totalShares = 0;
  let totalInvested = 0;
  const equity: { date: string; invested: number; value: number; shares: number }[] = [];
  let dayCounter = 0;
  let lastBuyIdx = -interval;
  const buys: { date: string; price: number; shares: number }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (i - lastBuyIdx >= interval) {
      const sharesBought = amountPerBuy / b.c;
      totalShares += sharesBought;
      totalInvested += amountPerBuy;
      lastBuyIdx = i;
      buys.push({ date: b.t, price: b.c, shares: sharesBought });
    }
    equity.push({
      date: b.t,
      invested: totalInvested,
      value: totalShares * b.c,
      shares: totalShares,
    });
    dayCounter++;
  }

  const last = equity[equity.length - 1];
  const finalValue = last?.value ?? 0;
  const totalPnl = finalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const avgCost = totalShares > 0 ? totalInvested / totalShares : 0;
  const finalPrice = bars[bars.length - 1]?.c ?? 0;

  // Annualised return based on first buy → today
  const firstBuy = buys[0];
  const yearsHeld = firstBuy
    ? (new Date(last.date).getTime() - new Date(firstBuy.date).getTime()) /
      (365 * 86400 * 1000)
    : 0;
  const cagr =
    yearsHeld > 0 && totalInvested > 0
      ? (Math.pow(finalValue / totalInvested, 1 / yearsHeld) - 1) * 100
      : 0;

  // Lump-sum benchmark: invest the same total invested at the start
  const lumpsumShares = firstBuy ? totalInvested / firstBuy.price : 0;
  const lumpsumValue = lumpsumShares * finalPrice;
  const lumpsumPnlPct =
    totalInvested > 0 ? ((lumpsumValue - totalInvested) / totalInvested) * 100 : 0;

  return NextResponse.json({
    symbol,
    cadence,
    amountPerBuy,
    years,
    interval_days: interval,
    total_buys: buys.length,
    total_invested: totalInvested,
    total_shares: totalShares,
    final_value: finalValue,
    final_price: finalPrice,
    avg_cost: avgCost,
    total_pnl: totalPnl,
    total_pnl_pct: totalPnlPct,
    cagr,
    lumpsum_value: lumpsumValue,
    lumpsum_pnl_pct: lumpsumPnlPct,
    equity: equity.filter((_, i) => i % 7 === 0), // weekly samples for chart
  });
});
