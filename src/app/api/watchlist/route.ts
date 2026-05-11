import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getList(userId: string): Promise<string[]> {
  const admin = adminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const list = data?.user?.user_metadata?.watchlist;
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

async function saveList(
  userId: string,
  list: string[],
  existingMetadata: Record<string, unknown>
) {
  const admin = adminClient();
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...existingMetadata, watchlist: list },
  });
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getList(user.id);
  return NextResponse.json({ watchlist: list });
});

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sym = body.symbol.toUpperCase().trim();
  if (!sym || !/^[A-Z0-9./-]{1,12}$/.test(sym)) {
    return NextResponse.json({ error: "Invalid symbol format" }, { status: 422 });
  }

  const current = await getList(user.id);
  if (current.includes(sym)) {
    return NextResponse.json({ watchlist: current });
  }
  if (current.length >= 30) {
    return NextResponse.json(
      { error: "Watchlist is full (max 30 symbols)" },
      { status: 422 }
    );
  }

  const next = [...current, sym];
  await saveList(user.id, next, user.user_metadata ?? {});
  return NextResponse.json({ watchlist: next });
});

export const DELETE = withApi(async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sym = new URL(request.url).searchParams.get("symbol")?.toUpperCase();
  if (!sym) {
    return NextResponse.json({ error: "Missing symbol param" }, { status: 400 });
  }

  const current = await getList(user.id);
  const next = current.filter((s) => s !== sym);
  await saveList(user.id, next, user.user_metadata ?? {});
  return NextResponse.json({ watchlist: next });
});
