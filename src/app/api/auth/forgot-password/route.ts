import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `auth-forgot:${ip}`, ...RATE_LIMITS.auth });
  if (!rl.allowed) {
    // Same generic message either way — don't let the rate-limit branch
    // itself become an email-enumeration or "is rate limiting on" signal.
    return NextResponse.redirect(
      new URL(
        "/forgot-password?message=If%20that%20email%20exists%2C%20a%20reset%20link%20has%20been%20sent",
        request.url
      )
    );
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=Email%20required", request.url)
    );
  }

  const supabase = await createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  // Always show success to prevent email enumeration attacks
  // (even if the email doesn't exist, we don't say so)
  if (error) {
    console.error("Reset password error:", error.message);
  }

  return NextResponse.redirect(
    new URL(
      "/forgot-password?message=If%20that%20email%20exists%2C%20a%20reset%20link%20has%20been%20sent",
      request.url
    )
  );
}
