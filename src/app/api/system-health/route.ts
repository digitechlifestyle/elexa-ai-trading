import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

interface Check { name: string; ok: boolean; detail?: string; }

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const checks: Check[] = [];
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "ALPACA_API_KEY",
    "ALPACA_API_SECRET",
  ];
  for (const v of required) {
    checks.push({ name: `env: ${v}`, ok: !!process.env[v], detail: process.env[v] ? "set" : "missing" });
  }

  try {
    const { error } = await supabase.from("trades").select("id", { count: "exact", head: true }).limit(1);
    checks.push({ name: "supabase.db", ok: !error, detail: error?.message });
  } catch (e) {
    checks.push({ name: "supabase.db", ok: false, detail: String(e) });
  }

  try {
    const res = await withTimeout(
      fetch("https://paper-api.alpaca.markets/v2/account", {
        headers: {
          "APCA-API-KEY-ID": process.env.ALPACA_API_KEY || "",
          "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET || "",
        },
      }),
      5000,
    );
    checks.push({ name: "alpaca.paper", ok: !!(res && res.ok), detail: res ? `HTTP ${res.status}` : "timeout" });
  } catch (e) {
    checks.push({ name: "alpaca.paper", ok: false, detail: String(e) });
  }

  try {
    const res = await withTimeout(
      fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
      }),
      5000,
    );
    checks.push({ name: "anthropic.api", ok: !!(res && res.ok), detail: res ? `HTTP ${res.status}` : "timeout" });
  } catch (e) {
    checks.push({ name: "anthropic.api", ok: false, detail: String(e) });
  }

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks });
});
