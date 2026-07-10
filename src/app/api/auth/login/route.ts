import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirectTo") ?? "/dashboard";

  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `auth-login:${ip}`, ...RATE_LIMITS.auth });
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL("/login?error=Too%20many%20attempts.%20Try%20again%20in%20a%20minute.", request.url)
    );
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
