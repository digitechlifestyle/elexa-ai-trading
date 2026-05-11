# Stripe Setup — Payments + Paywall

15-minute setup. Required to charge for Researcher ($29/mo) and Pro ($99/mo) tiers.

## 1. Create Stripe Account

1. Go to https://stripe.com/signup
2. Sign up, verify email
3. In dashboard, stay in **Test mode** for now (toggle top-right)

## 2. Create Products & Prices in Stripe

For each of these three products, in Stripe dashboard → **Products** → **+ Add product**:

### Researcher
- Name: `Researcher`
- Price: `$29.00 USD`
- Billing: **Recurring**, **Monthly**
- After saving, copy the **Price ID** (looks like `price_1ABCxxx`) — you'll need it as `STRIPE_PRICE_RESEARCHER`

### Pro
- Name: `Pro`
- Price: `$99.00 USD`
- Billing: **Recurring**, **Monthly**
- Copy Price ID → `STRIPE_PRICE_PRO`

### Team (optional)
- Name: `Team`
- Price: `$499.00 USD`
- Billing: **Recurring**, **Monthly**
- Copy Price ID → `STRIPE_PRICE_TEAM`

## 3. Grab Your API Keys

1. Stripe dashboard → **Developers** → **API keys**
2. Copy **Secret key** (starts with `sk_test_...` in test mode, `sk_live_...` in live mode) → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** (`pk_test_...`) → not required server-side, but save for later

## 4. Set Up Webhook

1. Stripe dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://elexa-ai-trading.vercel.app/api/billing/webhook`
3. **Events to send** (select these four):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. On the endpoint detail page, click **Reveal signing secret** (under "Signing secret")
6. Copy that value (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

## 5. Add Env Vars to Vercel

Vercel → your project → Settings → Environment Variables. Add:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_xxx` (or `sk_live_xxx`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` |
| `STRIPE_PRICE_RESEARCHER` | `price_xxx` (the Researcher Price ID) |
| `STRIPE_PRICE_PRO` | `price_xxx` (the Pro Price ID) |
| `STRIPE_PRICE_TEAM` | `price_xxx` (optional) |

Click **Save**, then trigger a **Redeploy** for them to take effect.

## 6. Test the Flow

1. Sign in as a test user (NOT an owner — owners get unlimited access for free)
2. Go to https://elexa-ai-trading.vercel.app/pricing
3. Click **Start Researcher**
4. You'll be redirected to Stripe Checkout
5. Use Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
6. Complete purchase
7. You'll be redirected back to `/dashboard?upgraded=1`
8. Try clicking the **Auto Trade ✨** tab — should be unlocked (was locked on Free)

## 7. Going Live

When ready to take real money:
1. Stripe dashboard → toggle to **Live mode** (top-right)
2. Redo steps 2-4 in **live mode** (separate Products/Prices/Keys/Webhook)
3. Update Vercel env vars to the `sk_live_...` and live `price_...` values
4. Redeploy

## Plan Tiers — Feature Matrix

| Feature | Free | Researcher $29 | Pro $99 | Team $499 |
|---------|------|----------------|---------|-----------|
| Paper trading | ✓ | ✓ | ✓ | ✓ |
| AI agent runs/day | 5 | unlimited | unlimited | unlimited |
| Portfolios | 1 | 3 | 10 | 100 |
| Journal retention | 30 days | 1 year | 10 years | 10 years |
| Watchlist symbols | 5 | 30 | 100 | 500 |
| CSV export | ✗ | ✓ | ✓ | ✓ |
| Auto-Trade workflow | ✗ | ✗ | ✓ | ✓ |
| Custom risk profiles | ✗ | ✗ | ✓ | ✓ |
| Team seats | — | — | — | 10 |

## Compliance Reminder

The pricing page already discloses this is for research only, not advice. Don't change that copy without Compliance Agent review.

Cannot charge for "investment advice" — only for software access, compute, education, tooling. Stripe and Apple actively review fintech apps. Use careful copy.
