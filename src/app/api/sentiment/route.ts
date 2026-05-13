import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

/**
 * Crypto Fear & Greed index — free public API from Alternative.me.
 * Returns latest reading 0-100 + classification.
 */
export const GET = withApi(async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=30", {
      next: { revalidate: 1800 }, // cache 30 min
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const data = await res.json();
    const points = (data?.data ?? []).map((d: { value: string; value_classification: string; timestamp: string }) => ({
      value: Number(d.value),
      label: d.value_classification,
      date: new Date(Number(d.timestamp) * 1000).toISOString(),
    }));
    return NextResponse.json({ points });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
});
