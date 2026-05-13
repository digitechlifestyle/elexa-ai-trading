import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

// FRED tenor series — full curve banks watch
const TENORS = [
  { id: "DGS1MO", label: "1M", years: 0.083 },
  { id: "DGS3MO", label: "3M", years: 0.25 },
  { id: "DGS6MO", label: "6M", years: 0.5 },
  { id: "DGS1", label: "1Y", years: 1 },
  { id: "DGS2", label: "2Y", years: 2 },
  { id: "DGS3", label: "3Y", years: 3 },
  { id: "DGS5", label: "5Y", years: 5 },
  { id: "DGS7", label: "7Y", years: 7 },
  { id: "DGS10", label: "10Y", years: 10 },
  { id: "DGS20", label: "20Y", years: 20 },
  { id: "DGS30", label: "30Y", years: 30 },
];

export const GET = withApi(async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FRED_API_KEY not configured", configured: false },
      { status: 503 }
    );
  }
  const out: { label: string; years: number; yield: number | null; date: string | null }[] = [];
  for (const t of TENORS) {
    try {
      const res = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${t.id}&api_key=${key}&file_type=json&sort_order=desc&limit=1`,
        { next: { revalidate: 1800 } }
      );
      if (!res.ok) {
        out.push({ label: t.label, years: t.years, yield: null, date: null });
        continue;
      }
      const data = await res.json();
      const obs = data?.observations?.[0];
      const v = obs?.value === "." ? null : Number(obs?.value);
      out.push({
        label: t.label,
        years: t.years,
        yield: Number.isFinite(v) ? v : null,
        date: obs?.date ?? null,
      });
    } catch {
      out.push({ label: t.label, years: t.years, yield: null, date: null });
    }
  }
  const tenYr = out.find((x) => x.label === "10Y")?.yield ?? null;
  const twoYr = out.find((x) => x.label === "2Y")?.yield ?? null;
  const threeMo = out.find((x) => x.label === "3M")?.yield ?? null;
  const spread_10_2 = tenYr != null && twoYr != null ? tenYr - twoYr : null;
  const spread_10_3m = tenYr != null && threeMo != null ? tenYr - threeMo : null;
  return NextResponse.json({
    points: out,
    spread_10_2,
    spread_10_3m,
    inverted_10_2: spread_10_2 != null && spread_10_2 < 0,
    inverted_10_3m: spread_10_3m != null && spread_10_3m < 0,
  });
});
