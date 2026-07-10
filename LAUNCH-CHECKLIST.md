# Elexa AI Trading — Launch Checklist

Step-by-step from "code done" to "ready for first users." Do NOT skip.

---

## STEP 1 — Deploy to Vercel + wire domain

### 1a. Verify GitHub push
- Code is at: https://github.com/digitechlifestyle/elexa-ai-trading
- Latest commit should match local `git log`

### 1b. Connect to Vercel (if not done already)
1. Go to https://vercel.com → log in
2. **Add New Project** → Import `digitechlifestyle/elexa-ai-trading`
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `./` (leave default)
5. Build command: leave default (`npm run build`)
6. Output directory: leave default (`.next`)
7. DO NOT deploy yet — add env vars first ↓

### 1c. Add Environment Variables on Vercel
Settings → Environment Variables. All three scopes: **Production**, **Preview**, **Development**.

Required (must have all):
```
NEXT_PUBLIC_SUPABASE_URL          = https://gkmtgcrtpmewjxcjogye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = <Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY         = <Supabase service role>
ANTHROPIC_API_KEY                 = <Anthropic key, starts sk-ant-...>
ALPACA_API_KEY                    = <Alpaca paper key>
ALPACA_API_SECRET                 = <Alpaca paper secret>
LIVE_TRADING_ENABLED              = false
```

Optional (add if features needed):
```
STRIPE_SECRET_KEY                 = sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET             = whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_... or pk_live_...
SMTP_HOST / SMTP_USER / SMTP_PASS  = (for email alerts)
RESEND_API_KEY                     = (if using Resend instead)
```

### 1d. First deploy
- Click **Deploy** in Vercel
- Wait ~3-5 minutes
- Should get URL like `elexa-ai-trading.vercel.app`

### 1e. Wire custom domain
1. Vercel → Project → Settings → Domains
2. Add `elexaaitrading.com` and `www.elexaaitrading.com`
3. Vercel will give you DNS records:
   - `A` record: `76.76.21.21`
   - `CNAME` record: `cname.vercel-dns.com`
4. Go to your domain registrar (GoDaddy / Namecheap / etc) → DNS → add records
5. Wait 5-30 minutes for DNS propagation
6. SSL provisions automatically once DNS is live

### 1f. Test
- Visit https://elexaaitrading.com
- Should load landing page
- Check status: should be 🟢 SSL active

---

## STEP 2 — System Health check

### 2a. Sign in (or create admin account)
1. Visit https://elexaaitrading.com/login
2. Sign up if needed
3. Confirm email (check spam — fix in step 6 if no email arrives)

### 2b. Run health check
1. Navigate to **Account → System Health** in sidebar
2. Or direct URL: https://elexaaitrading.com/dashboard/system-health

### 2c. Fix any red ❌ checks

Expected checks:
| Check | If red, fix by |
|---|---|
| `env: NEXT_PUBLIC_SUPABASE_URL` | Add to Vercel env, redeploy |
| `env: NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `env: SUPABASE_SERVICE_ROLE_KEY` | Same |
| `env: ANTHROPIC_API_KEY` | Get from console.anthropic.com → Vercel |
| `env: ALPACA_API_KEY` | Get from alpaca.markets paper account |
| `env: ALPACA_API_SECRET` | Same |
| `supabase.db` | Check anon key + URL are correct |
| `alpaca.paper` | Keys may be expired; regenerate |
| `anthropic.api` | Key may be invalid; check Anthropic console |

After each fix → Vercel → Deployments → **Redeploy** latest.

### 2d. Goal: 9/9 green ✅

---

## STEP 3 — Fresh user walkthrough

### 3a. Open incognito / private browser
- Avoid cached state from your admin account

### 3b. Sign up as a brand new user
- Email: use a different real email
- Confirm via email link

### 3c. Seed demo data
- Sidebar → **Account → Demo Data** (or `/dashboard/demo`)
- Click "Seed demo data"
- Wait for confirmation message
- Should see "Seeded 60 trades + ~8 journal entries"

### 3d. Click through EVERY sidebar group

Open each category, visit each page, **note anything that breaks**:

- [ ] **Trade** (9 pages)
- [ ] **Charts & Indicators** (8 pages)
- [ ] **Scanners** (12 pages)
- [ ] **Macro & Sentiment** (15 pages)
- [ ] **Risk & Sizing** (13 pages)
- [ ] **Portfolio Tools** (14 pages)
- [ ] **Calculators** (7 pages)
- [ ] **Backtest** (3 pages)
- [ ] **AI & Agents** (3 pages)
- [ ] **Community** (4 pages)
- [ ] **Account** (8 pages)

For each page, note in step 4:
- Does it load? (no 500 error)
- Does data appear? (or stuck spinner)
- Are buttons clickable?
- Does mobile look OK? (resize browser to ~400px)

---

## STEP 4 — Triage list

Fill this out as you go. Use the format below.

### Broken pages (500 errors / blank screens)
```
- [ ] /dashboard/<page>: <what happened>
```

### Pages with stuck spinners (data never loads)
```
- [ ] /dashboard/<page>: <which API never returned>
```

### Pages with wrong data
```
- [ ] /dashboard/<page>: <expected X, saw Y>
```

### Mobile issues
```
- [ ] /dashboard/<page>: <table overflow / button cut off / etc>
```

### Cosmetic / minor
```
- [ ] /dashboard/<page>: <typo / colour / spacing>
```

---

## STEP 5 — Fix top 10

Prioritise:
1. **Auth blockers** (can't sign up / log in / confirm email)
2. **500 errors** on common pages (Overview, Portfolio, Charts)
3. **Stripe upgrade flow** if monetising
4. **Mobile-broken core pages** (Overview, Portfolio)
5. **Data integrity** (wrong P&L, wrong positions)

Skip cosmetic + edge-case scanners for first pass.

---

## STEP 6 — Email setup (Supabase SMTP)

Default Supabase email is rate-limited (3 emails/hour). Configure custom SMTP:

1. Supabase Dashboard → Project → Settings → Auth → SMTP Settings
2. Use Resend (https://resend.com) — free 3k/mo, easiest
3. Get API key from Resend → Add to Supabase SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `<resend api key>`
   - Sender email: `noreply@elexaaitrading.com`
4. Add DNS records Resend gives you (SPF, DKIM, DMARC)

---

## STEP 7 — Stripe test (if monetising)

1. Stripe Dashboard → Developers → API keys
2. Use **test mode** keys initially → add to Vercel env
3. Create products + prices for each plan (Researcher $29, Pro $99, Team $499)
4. Copy price IDs to `/src/lib/billing/plans.ts`
5. Create webhook endpoint:
   - URL: `https://elexaaitrading.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
6. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var
7. Test with Stripe test card `4242 4242 4242 4242`
8. Switch to live keys when ready

---

## STEP 8 — Pre-launch sanity

- [ ] All 9 system-health checks green
- [ ] Demo seed works
- [ ] Can sign up + confirm email
- [ ] Can place paper trade in `/dashboard/portfolio`
- [ ] Equity curve appears in `/dashboard/trade-stats`
- [ ] At least one AI agent run succeeds (`/dashboard/agents`)
- [ ] Stripe test checkout succeeds (if billing live)
- [ ] Mobile sidebar drawer opens and closes
- [ ] Sign out works
- [ ] Password reset email arrives

---

## Don't deploy live trading

`LIVE_TRADING_ENABLED=false` stays until:
- Paper trading sustained 3+ months
- 100+ closed trades with positive expectancy
- Portfolio Health Score ≥ B (70+)
- Lawyer reviewed terms + risk disclaimer
- KYC / AML compliance path confirmed
