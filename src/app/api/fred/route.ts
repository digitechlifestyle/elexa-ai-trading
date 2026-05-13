import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

const SERIES = [
  { id: "GDP", label: "GDP (Bil $)", unit: "$" },
  { id: "CPIAUCSL", label: "CPI (all urban)", unit: "" },
  { id: "UNRATE", label: "Unemployment rate", unit: "%" },
  { id: "FEDFUNDS", label: "Fed funds rate", unit: "%" },
  { id: "DGS10", label: "10Y Treasury yield", unit: "%" },
  { id: "DGS2", label: "2Y Treasury yield", unit: "%" },
  { id: "T10Y2Y", label: "10Y-2Y spread", unit: "%" },
  { id: "M2SL", label: "M2 money supply", unit: "$B" },
  { id: "PAYEMS", label: "Nonfarm payrolls", unit: "k" },
  { id: "DCOILWTICO", label: "WTI crude oil", unit: "$" },
];

interface Observation {
  date: string;
  value: number | null;
}

interface SeriesResult {
  id: string;
  label: string;
  unit: string;
  latest: Observation | null;
  prior: Observation | null;
  change_pct: number | null;
  history: Observation[];
}

export const GET = withApi(async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "FRED_API_KEY not configured. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html and set as env var.",
        configured: false,
      },
      { status: 503 }
    );
  }

  const out: SeriesResult[] = [];
  for (const s of SERIES) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${key}&file_type=json&sort_order=desc&limit=24`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) {
        out.push({ ...s, latest: null, prior: null, change_pct: null, history: [] });
        continue;
      }
      const data = await res.json();
      const obs: Observation[] = (data?.observations ?? [])
        .map((o: { date: string; value: string }) => ({
          date: o.date,
          value: o.value === "." ? null : Number(o.value),
        }))
        .filter((o: Observation) => o.value != null);

      const latest = obs[0] ?? null;
      const prior = obs[1] ?? null;
      const change_pct =
        latest && prior && prior.value != null && prior.value !== 0
          ? ((latest.value! - prior.value) / prior.value) * 100
          : null;
      out.push({
        ...s,
        latest,
        prior,
        change_pct,
        history: obs.slice(0, 12).reverse(),
      });
    } catch {
      out.push({ ...s, latest: null, prior: null, change_pct: null, history: [] });
    }
  }

  return NextResponse.json({ series: out, configured: true });
});
