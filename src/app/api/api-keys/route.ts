import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { getPlanForUser } from "@/lib/billing/plans";
import {
  generateApiKey,
  type ApiKeyRecord,
} from "@/lib/api-keys";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

function getKeys(meta: Record<string, unknown> | null | undefined): ApiKeyRecord[] {
  const arr = meta?.api_keys;
  return Array.isArray(arr) ? (arr as ApiKeyRecord[]) : [];
}

async function persistKeys(
  userId: string,
  existingMeta: Record<string, unknown>,
  keys: ApiKeyRecord[]
) {
  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...existingMeta, api_keys: keys },
  });
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const keys = getKeys(user.user_metadata).map((k) => ({
    id: k.id,
    label: k.label,
    prefix: k.prefix,
    created_at: k.created_at,
    last_used_at: k.last_used_at ?? null,
  }));
  return NextResponse.json({ keys });
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

  const current = getKeys(user.user_metadata);
  if (current.length >= 5) {
    return NextResponse.json(
      { error: "Key limit reached (5). Revoke one first." },
      { status: 422 }
    );
  }

  const { plain, hash, prefix } = generateApiKey();
  const record: ApiKeyRecord = {
    id: randomUUID(),
    label,
    prefix,
    hash,
    created_at: new Date().toISOString(),
    last_used_at: null,
  };
  const next = [...current, record];
  await persistKeys(user.id, user.user_metadata ?? {}, next);

  // Plain key returned only on creation
  return NextResponse.json({
    key: { ...record, hash: undefined, plain },
  });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const current = getKeys(user.user_metadata);
  const next = current.filter((k) => k.id !== id);
  await persistKeys(user.id, user.user_metadata ?? {}, next);
  return NextResponse.json({ ok: true });
});
