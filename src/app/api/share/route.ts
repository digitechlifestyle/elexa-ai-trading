import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { makeShareToken } from "@/lib/share";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.trade_id !== "string") {
    return NextResponse.json({ error: "trade_id required" }, { status: 400 });
  }

  // Verify trade belongs to user
  const { data: trade } = await supabase
    .from("trades")
    .select("id")
    .eq("id", body.trade_id)
    .eq("user_id", user.id)
    .single();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  // Persist to user metadata
  const shared = Array.isArray(user.user_metadata?.shared_trade_ids)
    ? (user.user_metadata.shared_trade_ids as string[])
    : [];
  if (!shared.includes(body.trade_id)) {
    shared.push(body.trade_id);
    const admin = createAdminSdk(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        shared_trade_ids: shared,
      },
    });
  }

  const token = makeShareToken(user.id, body.trade_id);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  return NextResponse.json({
    token,
    url: `${appUrl}/share/${token}`,
  });
});
