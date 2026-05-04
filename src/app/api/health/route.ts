import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Health check endpoint for uptime monitoring + diagnostics.
 * Returns 200 + status: "ok" when healthy, 503 + status: "degraded" otherwise.
 */
export async function GET(request: Request) {
  const checks = {
    api: true,
    database: false,
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
    live_trading: process.env.LIVE_TRADING_ENABLED === "true",
  };

  // Diagnostic mode: ?debug=1 returns extra info to help fix env issues.
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";

  let dbError: string | null = null;
  const envSeen = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)",
    NEXT_PUBLIC_SUPABASE_URL_length: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").length,
    SUPABASE_SERVICE_ROLE_KEY_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY_prefix: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 12),
    SUPABASE_SERVICE_ROLE_KEY_length: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_prefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").slice(0, 12),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_length: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length,
  };

  // Database probe
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    if (error) {
      dbError = `${error.code ?? "unknown"}: ${error.message}`;
      checks.database = false;
    } else {
      checks.database = true;
    }
  } catch (err) {
    dbError = err instanceof Error ? `${err.name}: ${err.message}` : "unknown";
    checks.database = false;
  }

  const healthy = checks.api && checks.database && checks.anthropic_configured;

  const body: Record<string, unknown> = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  };
  if (debug) {
    body.dbError = dbError;
    body.env = envSeen;
  }

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
