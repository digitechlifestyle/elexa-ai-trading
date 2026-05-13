import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

async function latestFred(series: string, key: string): Promise<{ value: number | null; date: string | null }> {
  try {
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${key}&file_type=json&sort_order=desc&limit=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { value: null, date: null };
    const data = await res.json();
    const obs = data?.observations?.[0];
    const v = obs?.value === "." ? null : Number(obs?.value);
    return { value: Number.isFinite(v) ? v : null, date: obs?.date ?? null };
  } catch {
    return { value: null, date: null };
  }
}

async function historyFred(
  series: string,
  key: string,
  limit = 20
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

function classify(ratio: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (ratio < 75) return { label: "Significantly undervalued", tone: "good" };
  if (ratio < 90) return { label: "Modestly undervalued", tone: "good" };
  if (ratio < 115) return { label: "Fairly valued", tone: "warn" };
  if (ratio < 135) return { label: "Modestly overvalued", tone: "bad" };
  return { label: "Significantly overvalued", tone: "bad" };
}

export const GET = withApi(async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FRED_API_KEY not configured" },
      { status: 503 }
    );
  }

  const [mcapLatest, gdpLatest, mcapHist, gdpHist] = await Promise.all([
    latestFred("WILL5000PRFC", key),
    latestFred("GDP", key),
    historyFred("WILL5000PRFC", key, 40),
    historyFred("GDP", key, 40),
  ]);

  // Wilshire 5000 is in $ billions, GDP in $ billions (annualised). Ratio = mcap / GDP * 100
  const ratio =
    mcapLatest.value != null && gdpLatest.value != null && gdpLatest.value > 0
      ? (mcapLatest.value / gdpLatest.value) * 100
      : null;
  const classification = ratio != null ? classify(ratio) : null;

  // Build history by aligning dates roughly — use mcap dates and pair with nearest prior GDP
  const history: { date: string; ratio: number }[] = [];
  for (const m of mcapHist) {
    const prior = [...gdpHist]
      .filter((g) => g.date <= m.date)
      .pop();
    if (prior && prior.value > 0) {
      history.push({ date: m.date, ratio: (m.value / prior.value) * 100 });
    }
  }

  return NextResponse.json({
    ratio,
    classification,
    mcap_bn: mcapLatest.value,
    gdp_bn: gdpLatest.value,
    mcap_date: mcapLatest.date,
    gdp_date: gdpLatest.date,
    history,
  });
});
