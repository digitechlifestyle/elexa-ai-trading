import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Auth callback handler for email links (password reset, email confirmation,
 * magic links). Exchanges the code in the URL for a session, then redirects
 * to the appropriate next page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code or exchange failed — send back to login with an error
  return NextResponse.redirect(
    `${origin}/login?error=Could%20not%20verify%20link.%20Please%20request%20a%20new%20one.`
  );
}
