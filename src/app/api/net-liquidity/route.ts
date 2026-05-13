import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

async function fredSeries(
  series: string,
  key: string,
  limit: number
): Promise<{ date: string; value: number }[]> {
  try {
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.observations ?? [])
      .map((o: { date: string; value: string }) => ({
        date: o.date,
        value: o.value === "." ? NaN : Number(o.value),
      }))
      .filter((o: { value: number }) => Number.isFinite(o.value))
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Net liquidity = Fed Balance Sheet (WALCL) - Treasury General Account (WTREGEN)
 *               - Reverse Repo (RRPONTSYD)
 *
 * WALCL and WTREGEN are in $ millions, RRPONTSYD in $ billions.
 * Output in $ millions, display in trillions.
 */
export const GET = withApi(async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FRED_API_KEY not configured" },
      { status: 503 }
    );
  }
  const [walcl, tga, rrp] = await Promise.all([
    fredSeries("WALCL", key, 104), // ~2 years weekly
    fredSeries("WTREGEN", key, 104),
    fredSeries("RRPONTSYD", key, 365), // daily — sample weekly
  ]);

  // Index by date for alignment
  const tgaByDate = new Map(tga.map((p) => [p.date, p.value]));
  const rrpByDate = new Map(rrp.map((p) => [p.date, p.value]));

  function nearest<T>(map: Map<string, T>, date: string): T | null {
    if (map.has(date)) return map.get(date)!;
    // Walk back to find latest <= date
    let bestKey = "";
    for (const k of map.keys()) {
      if (k <= date && k > bestKey) bestKey = k;
    }
    return bestKey ? map.get(bestKey)! : null;
  }

  const series: { date: string; net_m: number; walcl_m: number; tga_m: number; rrp_m: number }[] = [];
  for (const p of walcl) {
    const tgaV = nearest(tgaByDate, p.date) ?? 0;
    const rrpB = nearest(rrpByDate, p.date) ?? 0;
    const rrpM = rrpB * 1000; // convert $B → $M
    const net = p.value - tgaV - rrpM;
    series.push({
      date: p.date,
      net_m: net,
      walcl_m: p.value,
      tga_m: tgaV,
      rrp_m: rrpM,
    });
  }

  const latest = series[series.length - 1] ?? null;
  const prior = series.length >= 5 ? series[series.length - 5] : null;
  const change_m =
    latest && prior ? latest.net_m - prior.net_m : null;
  const change_pct =
    latest && prior && prior.net_m !== 0
      ? ((latest.net_m - prior.net_m) / prior.net_m) * 100
      : null;

  return NextResponse.json({
    latest,
    change_m,
    change_pct,
    series: series.slice(-104),
  });
});
