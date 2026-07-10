import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS, type PlanTier } from "@/lib/billing/plans";
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

  const body = await request.json().catch(() => null);
  const plan = body?.plan as PlanTier | undefined;
  if (!plan || !PLANS[plan] || !PLANS[plan].stripe_price_id) {
    return NextResponse.json(
      { error: "Invalid plan or plan not configured" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // Ensure we have a Stripe customer linked to this user.
  // app_metadata, not user_metadata — the latter is user-writable via the
  // client SDK, which would let anyone point their "subscription" at a
  // Stripe customer of their choosing. See billing/webhook/route.ts.
  let customerId = user.app_metadata?.stripe_customer_id as string | undefined;

  if (!customerId) {
    // Idempotency key: a double-click or duplicate request reuses the same
    // Stripe customer instead of creating an orphaned second one.
    const customer = await stripe.customers.create(
      {
        email: user.email,
        metadata: { user_id: user.id },
      },
      { idempotencyKey: `customer-create-${user.id}` }
    );
    customerId = customer.id;
    // Persist on app_metadata via admin client
    const admin = createAdminSdk(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        stripe_customer_id: customerId,
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PLANS[plan].stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/pricing?cancelled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
});
