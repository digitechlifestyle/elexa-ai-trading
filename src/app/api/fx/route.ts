import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

/**
 * FX rates via Frankfurter — free, no key, ECB reference rates.
 * https://www.frankfurter.app/
 */
export const GET = withApi(async function GET(request: Request) {
  const url = new URL(request.url);
  const base = (url.searchParams.get("base") || "USD").toUpperCase();
  const symbols =
    url.searchParams.get("symbols") || "EUR,GBP,JPY,CHF,AUD,CAD,CNY,INR,MXN,BRL,KRW,SGD,HKD,SEK,NOK,NZD,ZAR,TRY,PLN";
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?base=${base}&symbols=${symbols}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      base: data.base,
      date: data.date,
      rates: data.rates ?? {},
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
});
