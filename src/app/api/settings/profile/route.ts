import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
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
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const displayName =
    typeof body.display_name === "string"
      ? body.display_name.slice(0, 30).trim()
      : "";
  const optIn = body.public_leaderboard_opt_in === true;

  // Display name validation — basic safe chars only
  if (displayName && !/^[A-Za-z0-9_\- .]{0,30}$/.test(displayName)) {
    return NextResponse.json(
      {
        error:
          "Display name can contain letters, numbers, underscores, spaces, dashes, and dots only.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      display_name: displayName || null,
      public_leaderboard_opt_in: optIn,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
