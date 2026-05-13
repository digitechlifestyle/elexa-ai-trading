import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { NextResponse } from "next/server";

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await supabase
    .from("trades")
    .select("symbol")
    .eq("user_id", user.id);
  const set = new Set<string>();
  for (const r of data ?? []) set.add(r.symbol);
  return NextResponse.json({ symbols: Array.from(set).sort() });
});
