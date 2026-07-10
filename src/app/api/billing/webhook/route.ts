import { createClient as createAdminSdk } from "@supabase/supabase-js";
import { getStripe } from "@/lib/billing/stripe";
import { log } from "@/lib/observability/logger";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/**
 * Stripe webhook — keeps user.app_metadata in sync with subscription state.
 * Listens for: checkout.session.completed, customer.subscription.{created,updated,deleted}.
 * Configure endpoint in Stripe dashboard:
 *   URL: https://elexa-ai-trading.vercel.app/api/billing/webhook
 *   Events: checkout.session.completed, customer.subscription.*
 *
 * Deliberately app_metadata, not user_metadata: user_metadata is writable by
 * the user themselves via the client SDK (supabase.auth.updateUser()), so
 * plan/subscription_status lived at "call updateUser() from the browser
 * console and grant yourself the Team plan for free." app_metadata can only
 * be written with the service-role key, which only this webhook and the
 * checkout route hold.
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    log.error("stripe.webhook.signature_fail", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminSdk(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  async function applySubscription(sub: Stripe.Subscription, userId?: string) {
    const uid =
      userId ??
      (sub.metadata?.user_id as string | undefined) ??
      undefined;
    if (!uid) {
      log.warn("stripe.webhook.no_user_id", { subscription_id: sub.id });
      return;
    }
    const planRaw = (sub.metadata?.plan ?? "researcher") as string;
    const status = sub.status;

    // Read existing metadata so we don't clobber unrelated fields
    const { data } = await admin.auth.admin.getUserById(uid);
    const existing = data?.user?.app_metadata ?? {};

    await admin.auth.admin.updateUserById(uid, {
      app_metadata: {
        ...existing,
        plan: planRaw,
        subscription_status: status,
        subscription_id: sub.id,
        current_period_end: new Date(
          (sub as Stripe.Subscription & { current_period_end: number })
            .current_period_end * 1000
        ).toISOString(),
        stripe_customer_id: (sub.customer as string) ?? existing.stripe_customer_id,
      },
    });
    log.info("stripe.subscription.sync", {
      user_id: uid,
      plan: planRaw,
      status,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await applySubscription(
            sub,
            (session.metadata?.user_id as string | undefined) ??
              (sub.metadata?.user_id as string | undefined)
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub);
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (err) {
    log.error("stripe.webhook.handler_error", {
      type: event.type,
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
