/**
 * Buffett Indicator: total US stock market cap / GDP, from FRED.
 * Shared by /api/buffett (dashboard page) and the Quant Agent (real market
 * context), so both read the same real number instead of the agent guessing.
 */

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

export async function historyFred(
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

export function classifyBuffettRatio(ratio: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (ratio < 75) return { label: "Significantly undervalued", tone: "good" };
  if (ratio < 90) return { label: "Modestly undervalued", tone: "good" };
  if (ratio < 115) return { label: "Fairly valued", tone: "warn" };
  if (ratio < 135) return { label: "Modestly overvalued", tone: "bad" };
  return { label: "Significantly overvalued", tone: "bad" };
}

export interface BuffettIndicator {
  ratio: number | null;
  classification: { label: string; tone: "good" | "warn" | "bad" } | null;
  mcap_bn: number | null;
  gdp_bn: number | null;
  mcap_date: string | null;
  gdp_date: string | null;
}

export async function getBuffettIndicator(): Promise<BuffettIndicator | null> {
  const key = process.env.FRED_API_KEY;
  if (!key) return null;

  const [mcapLatest, gdpLatest] = await Promise.all([
    latestFred("WILL5000PRFC", key),
    latestFred("GDP", key),
  ]);

  const ratio =
    mcapLatest.value != null && gdpLatest.value != null && gdpLatest.value > 0
      ? (mcapLatest.value / gdpLatest.value) * 100
      : null;

  return {
    ratio,
    classification: ratio != null ? classifyBuffettRatio(ratio) : null,
    mcap_bn: mcapLatest.value,
    gdp_bn: gdpLatest.value,
    mcap_date: mcapLatest.date,
    gdp_date: gdpLatest.date,
  };
}
