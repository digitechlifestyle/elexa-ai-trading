import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `auth-reset:${ip}`, ...RATE_LIMITS.auth });
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL("/reset-password?error=Too%20many%20attempts.%20Try%20again%20in%20a%20minute.", request.url)
    );
  }

  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8) {
    return NextResponse.redirect(
      new URL("/reset-password?error=Password%20must%20be%20at%20least%208%20characters", request.url)
    );
  }

  if (password !== confirm) {
    return NextResponse.redirect(
      new URL("/reset-password?error=Passwords%20do%20not%20match", request.url)
    );
  }

  const supabase = await createClient();

  // The user must already have a valid session from clicking the email link.
  // Supabase auth's email link flow attaches a token that the client must exchange.
  // This route assumes the auth callback has run.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/reset-password?error=Reset%20link%20expired%20or%20invalid.%20Request%20a%20new%20one.", request.url)
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/reset-password?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/login?message=Password%20updated.%20Please%20sign%20in.", request.url)
  );
}
