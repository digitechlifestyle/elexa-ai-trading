import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Health check endpoint for uptime monitoring (UptimeRobot, BetterStack, etc.).
 * Verifies: API is reachable, Supabase is reachable, Anthropic key is present.
 *
 * Returns 200 + status: "ok" when healthy, 503 + status: "degraded" otherwise.
 */
export async function GET() {
  const checks = {
    api: true,
    database: false,
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
    live_trading: process.env.LIVE_TRADING_ENABLED === "true",
  };

  // Database probe
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  const healthy = checks.api && checks.database && checks.anthropic_configured;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
