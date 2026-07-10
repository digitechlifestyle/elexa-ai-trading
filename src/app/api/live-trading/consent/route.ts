import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { getClientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";

/**
 * Records explicit acceptance of the live-trading risk disclaimer.
 * Bump DISCLAIMER_VERSION whenever the disclaimer text changes materially —
 * existing acceptances of an older version don't count, so live-trading/route.ts
 * always checks against the current version.
 */
export const DISCLAIMER_VERSION = "v1-2026-07";

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("live_trading_consents")
    .select("disclaimer_version, accepted_at")
    .eq("user_id", user.id)
    .eq("disclaimer_version", DISCLAIMER_VERSION)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    accepted: !!data,
    disclaimer_version: DISCLAIMER_VERSION,
    accepted_at: data?.accepted_at ?? null,
  });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.accept !== true) {
    return NextResponse.json({ error: "Must explicitly accept" }, { status: 400 });
  }

  const { error } = await supabase.from("live_trading_consents").insert({
    user_id: user.id,
    disclaimer_version: DISCLAIMER_VERSION,
    ip: getClientIp(request),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, disclaimer_version: DISCLAIMER_VERSION });
});
