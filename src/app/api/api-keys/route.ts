import { createClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/observability/api-handler";
import { getPlanForUser } from "@/lib/billing/plans";
import { generateApiKey } from "@/lib/api-keys";
import { NextRequest, NextResponse } from "next/server";

// RLS on api_keys scopes every operation to the caller's own rows (see
// migration 008), so the session-scoped client is sufficient here — no
// service-role client needed for this route.

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("api_keys")
    .select("id, label, prefix, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ keys: data ?? [] });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pro/Team only
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const plan = getPlanForUser(user, profile?.role ?? null);
  if (plan.id !== "pro" && plan.id !== "team" && plan.id !== "owner") {
    return NextResponse.json(
      { error: "API access requires Pro tier or higher.", upgrade_url: "/pricing" },
      { status: 402 }
    );
  }

  const body = await request.json().catch(() => null);
  const label =
    typeof body?.label === "string" && body.label.trim()
      ? body.label.slice(0, 40).trim()
      : "Untitled";

  const { count } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Key limit reached (5). Revoke one first." },
      { status: 422 }
    );
  }

  const { plain, hash, prefix } = generateApiKey();
  const { data: record, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, label, prefix, hash })
    .select("id, label, prefix, created_at, last_used_at")
    .single();

  if (error || !record) {
    return NextResponse.json({ error: error?.message ?? "Failed to create key" }, { status: 500 });
  }

  // Plain key returned only on creation — never stored anywhere
  return NextResponse.json({ key: { ...record, plain } });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("api_keys").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
});
