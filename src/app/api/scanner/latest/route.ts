import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

/**
 * Public scanner endpoint — returns the most recent scanner agent_run.
 * Auth required (any signed-in user).
 */
export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data } = await admin
    .from("agent_runs")
    .select("output, created_at")
    .eq("agent", "scanner")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return NextResponse.json({ scan: null });
  }

  return NextResponse.json({
    scan: {
      content: data.output,
      generated_at: data.created_at,
    },
  });
});
