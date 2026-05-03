# Elexa AI Trading — Testing Checklist

Complete ALL items before considering live trading. Document pass/fail for each.

---

## Phase 1 — Infrastructure

- [ ] `npm run dev` starts without errors
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] All env vars load correctly (no `undefined` in logs)
- [ ] Supabase connection verified (user can sign up, profile row created)

---

## Phase 2 — Auth & Access Control

- [ ] New user can sign up and is redirected to dashboard
- [ ] Unauthenticated user redirected to `/login` when accessing `/dashboard`
- [ ] Unauthenticated user redirected to `/login` when accessing `/admin`
- [ ] Non-admin user sees "Access Denied" on `/admin`
- [ ] Admin user can access admin panel
- [ ] Sign out works and session is cleared

---

## Phase 3 — Paper Trading

- [ ] Paper BUY order placed successfully for a valid symbol (e.g., AAPL)
- [ ] Paper SELL order placed successfully
- [ ] Trade appears in Supabase `trades` table with `is_paper = true`
- [ ] Trade appears in Dashboard overview
- [ ] Invalid symbol returns a clear error (not a 500)
- [ ] Quantity of 0 or negative is rejected
- [ ] Order value exceeding `max_position_size_usd` ($5,000) is rejected
- [ ] Daily loss limit triggers and blocks further trades
- [ ] `LIVE_TRADING_ENABLED=false` prevents any live order path

---

## Phase 4 — AI Agents

- [ ] Quant Agent runs and returns structured JSON
- [ ] Risk Agent approves a valid trade proposal
- [ ] Risk Agent rejects a proposal that exceeds limits
- [ ] Compliance Agent flags "guaranteed profit" language
- [ ] Compliance Agent passes clean educational content
- [ ] CEO Agent returns a coherent markdown briefing
- [ ] SEO Agent returns a blog post with disclaimer
- [ ] Support Agent declines to give financial advice when asked
- [ ] All agent runs logged in `agent_runs` table with status
- [ ] Failed agent runs logged with `status = 'failed'`

---

## Phase 5 — Compliance & Legal

- [ ] Risk disclaimer banner visible on every public page
- [ ] Footer disclaimer present on all pages
- [ ] `/disclaimer` page loads and contains all required sections
- [ ] No "guaranteed profit" or "risk-free" language anywhere in the UI
- [ ] Pricing page includes compliance note
- [ ] Blog posts include disclaimer footer
- [ ] `robots.txt` disallows `/dashboard`, `/admin`, `/api/`
- [ ] Sitemap accessible at `/sitemap.xml`

---

## Phase 6 — SEO

- [ ] Landing page has `<title>` and `<meta description>`
- [ ] Blog posts have unique titles and meta descriptions
- [ ] Open Graph tags present on key pages
- [ ] Sitemap includes all public pages
- [ ] Lighthouse SEO score > 90 on landing page (run: Chrome DevTools → Lighthouse)

---

## Gate: Live Trading Sign-Off

**Do not change `LIVE_TRADING_ENABLED` to `true` until ALL of the following are complete:**

- [ ] All Phase 1–6 checks above pass
- [ ] Legal review completed by licensed attorney
- [ ] Alpaca live account created and approved
- [ ] Live API keys stored securely (not paper keys)
- [ ] `ALPACA_BASE_URL` changed to `https://api.alpaca.markets`
- [ ] A dedicated test run of 5 micro live paper-to-live trades completed
- [ ] Written confirmation from you (the owner) that live trading is authorised

---

_Last reviewed: — / — / —_
_Reviewed by: —_
