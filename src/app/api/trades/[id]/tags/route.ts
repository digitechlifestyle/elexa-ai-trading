import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * Tags are stored in user_metadata.trade_tags as { [tradeId]: string[] }.
 * Body: { tags: string[] } — replaces tags for that trade.
 */
export const POST = withApi(async function POST(
  request: NextRequest,
  _ctx
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tradeId = new URL(request.url).pathname.split("/").slice(-2, -1)[0];
  if (!tradeId) {
    return NextResponse.json({ error: "Missing trade id" }, { status: 400 });
  }

  // Verify trade belongs to user
  const { data: trade } = await supabase
    .from("trades")
    .select("id")
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .single();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.tags)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Sanitise tags
  const tags = body.tags
    .filter((t: unknown): t is string => typeof t === "string")
    .map((t: string) => t.trim().slice(0, 20))
    .filter((t: string) => /^[A-Za-z0-9_\-]{1,20}$/.test(t))
    .slice(0, 10);

  const existing = (user.user_metadata?.trade_tags ?? {}) as Record<
    string,
    string[]
  >;
  const next = { ...existing };
  if (tags.length === 0) {
    delete next[tradeId];
  } else {
    next[tradeId] = tags;
  }

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      trade_tags: next,
    },
  });

  return NextResponse.json({ tags });
});
