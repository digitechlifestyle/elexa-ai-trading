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
    // Log the actual error so we can see it in Vercel logs / pass it back
    console.error("Auth callback exchange error:", error.message, error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=No%20code%20in%20link.%20Please%20request%20a%20new%20one.`
  );
}
