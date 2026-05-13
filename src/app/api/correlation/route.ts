import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const ALPACA_CRYPTO_SYMBOLS = new Set([
  "AAVE","ADA","ARB","AVAX","BAT","BCH","BONK","BTC","CRV","DOGE","DOT","ETH",
  "FIL","GRT","HYPE","LDO","LINK","LTC","ONDO","PAXG","PEPE","POL","RENDER",
  "SHIB","SKY","SOL","SUSHI","TRUMP","UNI","USDC","USDG","USDT","WIF","XRP",
  "XTZ","YFI",
]);
function isCrypto(sym: string) {
  return sym.includes("/") || ALPACA_CRYPTO_SYMBOLS.has(sym.toUpperCase());
}
function normalize(sym: string) {
  const u = sym.toUpperCase();
  if (u.includes("/")) return u;
  if (ALPACA_CRYPTO_SYMBOLS.has(u)) return `${u}/USD`;
  return u;
}

async function fetchBars(symbol: string, days: number): Promise<number[]> {
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
  const bars: { c: number }[] = isCrypto(symbol)
    ? data?.bars?.[sym] ?? []
    : data?.bars ?? [];
  // Convert to daily returns
  const closes = bars.map((b) => b.c);
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) returns.push(closes[i] / closes[i - 1] - 1);
  }
  return returns;
}

function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const ax = a.slice(-n);
  const bx = b.slice(-n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const xa = ax[i] - ma;
    const xb = bx[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
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
    .slice(0, 12);
  const days = Math.max(30, Math.min(365, Number(body.days) || 90));
  if (symbols.length < 2) {
    return NextResponse.json({ error: "Need at least 2 symbols" }, { status: 422 });
  }

  // Fetch returns in parallel
  const series: Record<string, number[]> = {};
  await Promise.all(
    symbols.map(async (s) => {
      series[s] = await fetchBars(s, days);
    })
  );

  // Build matrix
  const matrix: (number | null)[][] = symbols.map((a) =>
    symbols.map((b) =>
      a === b ? 1 : pearson(series[a] ?? [], series[b] ?? [])
    )
  );
  return NextResponse.json({ symbols, days, matrix });
});
