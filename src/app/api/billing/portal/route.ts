import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { withApi } from "@/lib/observability/api-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = withApi(async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = user.user_metadata?.stripe_customer_id as
    | string
    | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "No subscription found. Subscribe first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
});
