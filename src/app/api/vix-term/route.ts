import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

const TENORS = [
  { id: "^VIX9D", label: "9-day", days: 9 },
  { id: "^VIX", label: "30-day", days: 30 },
  { id: "^VIX3M", label: "3-month", days: 90 },
  { id: "^VXMT", label: "6-month", days: 180 },
];

async function fetchYahooQuote(sym: string): Promise<{ price: number | null; date: string | null }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      next: { revalidate: 600 },
    });
    if (!res.ok) return { price: null, date: null };
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return { price: null, date: null };
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const timestamps: number[] = result.timestamp ?? [];
    const last = closes
      .map((c, i) => ({ c, t: timestamps[i] }))
      .filter((p) => Number.isFinite(p.c))
      .pop();
    if (!last) return { price: null, date: null };
    return {
      price: last.c,
      date: new Date(last.t * 1000).toISOString().slice(0, 10),
    };
  } catch {
    return { price: null, date: null };
  }
}

export const GET = withApi(async function GET() {
  const results = await Promise.all(
    TENORS.map(async (t) => ({
      ...t,
      ...(await fetchYahooQuote(t.id)),
    }))
  );
  const points = results.map((r) => ({
    label: r.label,
    days: r.days,
    value: r.price,
    date: r.date,
  }));
  const vix = points.find((p) => p.days === 30)?.value ?? null;
  const vix3m = points.find((p) => p.days === 90)?.value ?? null;
  const ratio = vix != null && vix3m != null && vix3m > 0 ? vix / vix3m : null;
  // Contango: front < back (ratio < 1) — calm market. Backwardation: ratio > 1 — stress.
  const regime =
    ratio == null
      ? "unknown"
      : ratio > 1.0
      ? "backwardation"
      : ratio > 0.95
      ? "flat"
      : "contango";
  return NextResponse.json({ points, vix_vix3m_ratio: ratio, regime });
});
