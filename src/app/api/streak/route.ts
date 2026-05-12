import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { computeStreak } from "@/lib/streak";
import { NextResponse } from "next/server";

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull last 365 days of activity
  const since = new Date(Date.now() - 365 * 86400 * 1000).toISOString();

  const [tradesRes, agentsRes] = await Promise.all([
    supabase
      .from("trades")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since),
    supabase
      .from("agent_runs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since),
  ]);

  const dates: string[] = [
    ...((tradesRes.data ?? []).map((r) => r.created_at)),
    ...((agentsRes.data ?? []).map((r) => r.created_at)),
  ];

  return NextResponse.json(computeStreak(dates));
});
