import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

/**
 * Admin setup endpoint — sets a user's password and confirms their email.
 * Requires the SUPABASE_SERVICE_ROLE_KEY to be supplied in the form.
 *
 * One-time bootstrap tool, disabled by default. Set ADMIN_SETUP_ENABLED=true
 * to turn it on temporarily, then unset it once the account is created —
 * leaving it on is a standing account-takeover path for anyone who ever
 * obtains the service role key.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch — pad to equal length first so
  // a wrong-length guess doesn't short-circuit before the timing-safe check.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  if (process.env.ADMIN_SETUP_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const rl = await checkRateLimit({ key: `admin-setup:${ip}`, ...RATE_LIMITS.auth });
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL("/admin/setup?error=Too%20many%20attempts.%20Try%20again%20shortly.", request.url)
    );
  }

  const formData = await request.formData();
  const serviceKey = formData.get("serviceKey") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!serviceKey || !email || !password) {
    return NextResponse.redirect(
      new URL("/admin/setup?error=All%20fields%20required", request.url)
    );
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      new URL("/admin/setup?error=Password%20must%20be%20at%20least%208%20characters", request.url)
    );
  }

  // Verify the supplied service key matches the env var (prevents misuse).
  // Constant-time compare — this is a secret-equality check reachable
  // pre-auth, so a naive !== is a (minor but free-to-fix) timing side channel.
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!expectedKey || !safeCompare(serviceKey, expectedKey)) {
    return NextResponse.redirect(
      new URL(
        "/admin/setup?error=Service%20key%20does%20not%20match.%20Copy%20it%20exactly%20from%20Vercel.",
        request.url
      )
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return NextResponse.redirect(
      new URL("/admin/setup?error=Server%20config%20error", request.url)
    );
  }

  // Create admin client with the verified service key
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find user by email
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    return NextResponse.redirect(
      new URL(
        `/admin/setup?error=${encodeURIComponent(`Lookup failed: ${listErr.message}`)}`,
        request.url
      )
    );
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    // Update existing user
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/admin/setup?error=${encodeURIComponent(`Update failed: ${error.message}`)}`,
          request.url
        )
      );
    }
  } else {
    // Create new user with confirmed email
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/admin/setup?error=${encodeURIComponent(`Create failed: ${error.message}`)}`,
          request.url
        )
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/admin/setup?message=Done.%20Password%20set%20and%20email%20confirmed.%20Now%20sign%20in.",
      request.url
    )
  );
}
