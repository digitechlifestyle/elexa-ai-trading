import { createAdminClient } from "@/lib/supabase/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — provide Bearer eai_<key>" },
      { status: 401 }
    );
  }
  const limit = Math.max(
    1,
    Math.min(500, Number(new URL(request.url).searchParams.get("limit")) || 100)
  );
  const supabase = await createAdminClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("id, symbol, side, qty, filled_price, status, is_paper, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return NextResponse.json({ trades: trades ?? [] });
}
