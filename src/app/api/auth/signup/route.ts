import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const refParam = (formData.get("ref") as string | null) ?? null;

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/signup?error=Email%20and%20password%20required", request.url)
    );
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      new URL(
        "/signup?error=Password%20must%20be%20at%20least%208%20characters",
        request.url
      )
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // If we have a ref code and a user, attach referred_by
  if (data.user && refParam && /^[A-Z0-9]{4,12}$/.test(refParam.toUpperCase())) {
    try {
      const admin = createAdminSdk(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      await admin.auth.admin.updateUserById(data.user.id, {
        user_metadata: {
          ...(data.user.user_metadata ?? {}),
          referred_by: refParam.toUpperCase(),
        },
      });
    } catch {
      // non-fatal — signup still succeeds
    }
  }

  // If email confirmation is required, redirect to login
  if (data.user && !data.session) {
    return NextResponse.redirect(
      new URL(
        "/login?message=Check%20your%20email%20to%20confirm%20your%20account",
        request.url
      )
    );
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
