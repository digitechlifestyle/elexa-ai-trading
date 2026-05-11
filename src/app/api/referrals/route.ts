import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { withApi } from "@/lib/observability/api-handler";
import { referralCodeForUser } from "@/lib/referrals";
import { NextResponse } from "next/server";

interface ReferredUser {
  id: string;
  email: string | null;
  created_at: string;
  active: boolean; // has placed at least 1 trade
}

export const GET = withApi(async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myCode = referralCodeForUser(user.id);

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // List all users, find ones referred by me.
  // Note: at scale this should be a Postgres view, but for now linear scan is fine.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const all = data?.users ?? [];

  const referred: ReferredUser[] = all
    .filter((u) => u.user_metadata?.referred_by === myCode && u.id !== user.id)
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      active: false, // filled below
    }));

  if (referred.length > 0) {
    const ids = referred.map((r) => r.id);
    const { data: trades } = await admin
      .from("trades")
      .select("user_id")
      .in("user_id", ids)
      .eq("status", "filled")
      .limit(referred.length * 2);
    const activeSet = new Set((trades ?? []).map((t) => t.user_id));
    for (const r of referred) {
      r.active = activeSet.has(r.id);
    }
  }

  const activeCount = referred.filter((r) => r.active).length;
  const reward_threshold = 3;
  const earned_rewards = Math.floor(activeCount / reward_threshold);

  return NextResponse.json({
    code: myCode,
    referred,
    total_referrals: referred.length,
    active_referrals: activeCount,
    reward_threshold,
    earned_rewards,
    next_reward_in: Math.max(0, reward_threshold - (activeCount % reward_threshold)),
  });
});
