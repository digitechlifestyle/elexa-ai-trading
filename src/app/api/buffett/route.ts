import { withApi } from "@/lib/observability/api-handler";
import { getBuffettIndicator, historyFred } from "@/lib/market/buffett";
import { NextResponse } from "next/server";

export const GET = withApi(async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FRED_API_KEY not configured" },
      { status: 503 }
    );
  }

  const [indicator, mcapHist, gdpHist] = await Promise.all([
    getBuffettIndicator(),
    historyFred("WILL5000PRFC", key, 40),
    historyFred("GDP", key, 40),
  ]);

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
    ratio: indicator?.ratio ?? null,
    classification: indicator?.classification ?? null,
    mcap_bn: indicator?.mcap_bn ?? null,
    gdp_bn: indicator?.gdp_bn ?? null,
    mcap_date: indicator?.mcap_date ?? null,
    gdp_date: indicator?.gdp_date ?? null,
    history,
  });
});
