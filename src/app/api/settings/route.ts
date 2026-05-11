import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

const MIN = 0.01;

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

  // Validate inputs — must all be positive finite numbers within sane bounds
  const max_position_size_usd = Number(body.max_position_size_usd);
  const max_daily_loss_usd = Number(body.max_daily_loss_usd);
  const max_open_positions = Number(body.max_open_positions);
  const stop_loss_pct = Number(body.stop_loss_pct);

  for (const [name, val, lo, hi] of [
    ["max_position_size_usd", max_position_size_usd, MIN, 1_000_000],
    ["max_daily_loss_usd", max_daily_loss_usd, MIN, 100_000],
    ["max_open_positions", max_open_positions, 1, 1000],
    ["stop_loss_pct", stop_loss_pct, 0.1, 50],
  ] as const) {
    if (!Number.isFinite(val) || val < lo || val > hi) {
      return NextResponse.json(
        { error: `Invalid ${name}: must be between ${lo} and ${hi}` },
        { status: 422 }
      );
    }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createAdminSdk(adminUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      risk_limits: {
        max_position_size_usd,
        max_daily_loss_usd,
        max_open_positions: Math.floor(max_open_positions),
        stop_loss_pct,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    risk_limits: {
      max_position_size_usd,
      max_daily_loss_usd,
      max_open_positions: Math.floor(max_open_positions),
      stop_loss_pct,
    },
  });
});
