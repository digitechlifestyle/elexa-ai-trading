# Elexa AI Trading — Monetization Plan

**Goal:** Sustainable revenue from a research/education tool without crossing into "investment advice" regulatory territory.

**Constraint:** Cannot charge for *advice* (regulated). Can charge for *tools, compute, education, automation*.

---

## 1. Revenue Streams (priority order)

### Tier A — Recurring SaaS subscriptions (primary, ~70% of revenue)

| Plan | Price | Target user | What they get |
|------|-------|-------------|---------------|
| **Free** | $0 | Curious / students | 1 paper portfolio, 5 agent runs/day, 30-day journal retention, community Discord |
| **Researcher** | $29/mo | Active paper trader | Unlimited agent runs, 3 portfolios, 1-year journal, all 6 agents, CSV export, priority support |
| **Pro** | $99/mo | Power user / quant learner | Unlimited everything, custom risk profiles, API access (read-only), live agent collaboration view, advanced backtesting (when built) |
| **Team** | $499/mo | Small fund / education provider | 10 seats, shared journal, admin panel, white-label option, dedicated onboarding |

Annual pricing: 2 months free (16% discount).

### Tier B — Educational products (secondary, ~20% of revenue)

- **AI Trading Research Workbook** — $19 one-off PDF + workbook, 60 pages.
- **Course: Building Your Quant Workflow** — $99 one-off, 6 hours video + companion templates.
- **Live cohort: AI-Assisted Paper Trading Masterclass** — $299 per cohort, 4 weeks, twice yearly. Capped at 50 students.

These also serve as upsell paths to Pro.

### Tier C — Affiliate revenue (tertiary, ~10% of revenue)

- Exchange referrals: Alpaca, Kraken, Coinbase pay $20–$200 per funded account. Disclosed clearly.
- Education affiliates: relevant books, courses, podcasts.
- Hardware referrals: monitors, keyboards (very low priority).

**Compliance line:** Affiliate disclosures on every linked page. No "I get paid for this" hidden.

### Tier D — Future (12+ months out, only after legal review)

- **Live trading subscription** ($199/mo addon to Pro) — once compliance + audit cleared, gated by separate KYC.
- **Strategy marketplace** — users sell their own backtested strategies. Elexa takes 20% commission. High legal complexity, defer.
- **B2B API** — finance educators license the agent platform for their classroom.

---

## 2. Pricing Psychology

- Free tier exists to **prove value**, not be a permanent home. Throttle on agent runs and retention.
- Researcher tier is the **default conversion target**. Position as "the natural step up after a week of paper trading".
- Pro tier exists to **anchor** — most users won't pay it, but its existence makes Researcher feel reasonable.
- Team tier exists for inbound enterprise — don't market it on the homepage; mention in footer.

Annual prepay produces upfront cash flow and lower churn.

---

## 3. Conversion Funnel

```
Visitor → Email subscriber → Free signup → Active paper trader → Paid subscriber
   100         15              5               2.5                  0.5
```

Industry-typical SaaS conversion is 0.2–2% visitor → paid. Target 0.5% in year 1.

### Key activation events (in order)
1. Email signup (lead magnet)
2. Account created
3. First paper trade placed
4. First agent run (Quant or Risk)
5. Second session within 7 days
6. Journal entry written
7. **Paid conversion** (if 4–6 happen, conversion likelihood >10x)

Engineering priority: instrument these events. Without telemetry, optimisation is guessing.

---

## 4. Pricing Fairness (positioning)

Cheaper than:
- TradingView Premium ($59.95/mo)
- TrendSpider ($107/mo)
- Trade Ideas ($118/mo)

Comparable to:
- Composer ($30/mo)
- Quantconnect ($20–$60/mo)

Premium to:
- Free brokerage tools (Robinhood, Public, etc. — but they don't have AI agents)

Positioning: cheaper than premium charting, more capable than free brokers, the only one with multi-agent research.

---

## 5. Refund + Trial Policy

- 14-day free trial of Researcher tier (no credit card required for free tier first).
- 30-day money-back guarantee on annual plans.
- No refund on educational PDFs / courses (industry-standard).
- Cancel anytime, immediate effect, prorated refund where required by law (EU).

---

## 6. Compliance Lines That Affect Revenue

We **cannot** charge for:
- Specific trade signals ("buy AAPL today")
- Personalised investment advice
- Managed accounts of user funds

We **can** charge for:
- Software access
- Compute (agent runs)
- Storage (journal retention)
- Education
- Tooling (custom risk profiles, API access)

Stripe and Apple are increasingly scrutinising fintech apps. Use language carefully on the pricing page. Pricing page already drafted — review with the Compliance Agent before any change.

---

## 7. Payment Stack

- **Stripe** — primary processor. Subscriptions + one-off products.
- **Stripe Tax** — automatic VAT/sales tax handling.
- **Customer portal** — built-in self-serve cancel/upgrade.
- **Apple Pay / Google Pay** — enable on checkout.

Skip crypto payments at launch — too much compliance overhead for small revenue, can add later.

---

## 8. Unit Economics (rough)

Researcher tier ($29/mo):
- Stripe fee: ~$1.10
- Compute (Anthropic API): ~$3 per active user/month at typical use
- Database/hosting: ~$0.50
- Support: ~$1 per user/month at scale
- **Gross margin: ~$23.40 / 80%**

Pro tier ($99/mo):
- Higher compute use (~$10/month)
- Otherwise similar
- **Gross margin: ~$84 / 85%**

Acquisition cost target: <$50 per paid user → 2-month payback. Sustainable with content-led growth.

---

## 9. Year 1 Revenue Target

| Quarter | Free users | Paid users | MRR | Notes |
|---------|-----------|------------|-----|-------|
| Q1 | 200 | 0 | $0 | Free only, build product + waitlist |
| Q2 | 1,000 | 50 | $1,500 | Open paid tier, founders cohort |
| Q3 | 3,000 | 200 | $6,000 | YouTube + Reddit traction |
| Q4 | 8,000 | 500 | $15,000 | Scale content, refine pricing |

Year 1 ARR target: **$180k**. Modest but bootstrappable. Growth accelerates in Year 2 once content + brand compound.

---

## 10. Anti-patterns (don't do these)

- Don't sell "signals". Regulated and reputation-poisoning.
- Don't charge for free-tier limits before product is sticky. Earn the price.
- Don't add a token / NFT / coin. It will not help, will distract, and likely break compliance.
- Don't enable live trading until legal review complete. Don't even hint at it on the pricing page until then.
- Don't lock the journal behind paywall. Journal = retention. Journal = sticky. Journal = trust. Charge for compute, not data hostage-taking.
