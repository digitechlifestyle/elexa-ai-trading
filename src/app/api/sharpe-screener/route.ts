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

async function returns(symbol: string, days: number): Promise<number[]> {
  const sym = normalize(symbol);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);
  const url = isCrypto(symbol)
    ? `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(sym)}&timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400`
    : `https://data.alpaca.markets/v2/stocks/${sym}/bars?timeframe=1Day&start=${start.toISOString()}&end=${end.toISOString()}&limit=400&adjustment=split`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY ?? "",
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET ?? "",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const bars: { c: number }[] = isCrypto(symbol) ? data?.bars?.[sym] ?? [] : data?.bars ?? [];
  const closes = bars.map((b) => b.c);
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) r.push(closes[i] / closes[i - 1] - 1);
  }
  return r;
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
  if (!body || !Array.isArray(body.symbols)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const symbols = (body.symbols as string[])
    .map((s) => String(s).toUpperCase().trim())
    .filter((s) => /^[A-Z0-9./-]{1,12}$/.test(s))
    .slice(0, 30);
  const days = Math.max(60, Math.min(365, Number(body.days) || 180));

  const riskFreeAnnual = 0.04;
  const riskFreeDaily = riskFreeAnnual / 252;

  const rows = await Promise.all(
    symbols.map(async (sym) => {
      const r = await returns(sym, days);
      if (r.length < 20) {
        return {
          symbol: sym,
          n: r.length,
          mean_daily_pct: 0,
          std_daily_pct: 0,
          sharpe_annual: 0,
          ann_return_pct: 0,
          ann_vol_pct: 0,
          max_drawdown_pct: 0,
        };
      }
      const n = r.length;
      const m = r.reduce((s, v) => s + v, 0) / n;
      const v = r.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1);
      const sd = Math.sqrt(v);
      const annRet = ((1 + m) ** 252 - 1) * 100;
      const annVol = sd * Math.sqrt(252) * 100;
      const sharpe = sd > 0 ? ((m - riskFreeDaily) / sd) * Math.sqrt(252) : 0;
      // Max drawdown
      let peak = 1;
      let equity = 1;
      let maxDd = 0;
      for (const rr of r) {
        equity *= 1 + rr;
        if (equity > peak) peak = equity;
        const dd = (peak - equity) / peak;
        if (dd > maxDd) maxDd = dd;
      }
      return {
        symbol: sym,
        n,
        mean_daily_pct: m * 100,
        std_daily_pct: sd * 100,
        sharpe_annual: sharpe,
        ann_return_pct: annRet,
        ann_vol_pct: annVol,
        max_drawdown_pct: maxDd * 100,
      };
    })
  );

  rows.sort((a, b) => b.sharpe_annual - a.sharpe_annual);
  return NextResponse.json({ days, rows });
});
