import { createClient } from "@/lib/supabase/server";
import { createExchange } from "@/lib/exchanges/factory";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * Batch-fetch current prices for a list of symbols on a given exchange.
 * Returns { prices: { [symbol]: number | null } }.
 */
export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    !Array.isArray(body.symbols) ||
    typeof body.exchange !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const symbols: string[] = body.symbols
    .filter((s: unknown): s is string => typeof s === "string")
    .slice(0, 50); // cap

  const config = {
    name: body.exchange,
    api_key: process.env.ALPACA_API_KEY || "",
    api_secret: process.env.ALPACA_API_SECRET || "",
    base_url: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
  };

  let adapter;
  try {
    adapter = createExchange(body.exchange, config);
  } catch {
    return NextResponse.json({ error: "Unknown exchange" }, { status: 400 });
  }

  const prices: Record<string, number | null> = {};
  await Promise.all(
    symbols.map(async (s) => {
      try {
        prices[s] = await adapter.getAssetPrice(s);
      } catch {
        prices[s] = null;
      }
    })
  );

  return NextResponse.json({ prices });
});
