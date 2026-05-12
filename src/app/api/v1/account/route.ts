import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getPlanForUser } from "@/lib/billing/plans";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — provide Bearer eai_<key>" },
      { status: 401 }
    );
  }

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: userResp } = await admin.auth.admin.getUserById(auth.userId);
  const u = userResp?.user;
  if (!u) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.userId)
    .single();
  const plan = getPlanForUser(u, profile?.role ?? null);

  return NextResponse.json({
    user_id: u.id,
    email: u.email,
    display_name: u.user_metadata?.display_name ?? null,
    plan: plan.id,
    paper_only: true,
  });
}
