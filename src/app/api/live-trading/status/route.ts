import { createClient } from "@/lib/supabase/server";
import { isLiveTradingEnabled } from "@/lib/trading/risk-limits";
import { DISCLAIMER_VERSION } from "@/app/api/live-trading/consent/route";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

/**
 * Aggregates all three live-trading gates so the dashboard can show one
 * clear status instead of the client guessing at env state.
 */
export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [consentResult, connectionResult] = await Promise.all([
    supabase
      .from("live_trading_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("disclaimer_version", DISCLAIMER_VERSION)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("broker_connections")
      .select("last4, updated_at")
      .eq("user_id", user.id)
      .eq("exchange", "alpaca")
      .maybeSingle(),
  ]);

  return NextResponse.json({
    platform_enabled: isLiveTradingEnabled(),
    disclaimer_version: DISCLAIMER_VERSION,
    consent_accepted: !!consentResult.data,
    broker_connected: !!connectionResult.data,
    broker_last4: connectionResult.data?.last4 ?? null,
    broker_connected_at: connectionResult.data?.updated_at ?? null,
  });
});
