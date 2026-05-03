# Elexa AI Trading — Deployment Guide

## Recommended: Vercel + Supabase

### 1. Push to GitHub

```bash
git remote add origin https://github.com/digitechlifestyle/elexa-ai-trading.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `digitechlifestyle/elexa-ai-trading`
3. Framework: Next.js (auto-detected)
4. Add all environment variables from `.env.example`
5. Set `NEXT_PUBLIC_APP_URL` to `https://elexaaitrading.com`
6. Deploy

### 3. Custom Domain

In Vercel project settings → Domains:
- Add `elexaaitrading.com`
- Add `www.elexaaitrading.com` → redirect to apex

Update DNS at your registrar:
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

---

## Environment Variables in Production

Never commit `.env.local`. Set all variables in Vercel dashboard:

- `LIVE_TRADING_ENABLED` = `false` — **do not change without paper testing + legal sign-off**
- `ALPACA_BASE_URL` = `https://paper-api.alpaca.markets` — paper endpoint only
- `SUPABASE_SERVICE_ROLE_KEY` — mark as "sensitive" in Vercel

---

## Supabase in Production

1. In Supabase dashboard → Authentication → URL Configuration:
   - Site URL: `https://elexaaitrading.com`
   - Redirect URLs: `https://elexaaitrading.com/**`

2. Enable Row Level Security (already in migration — verify it's on)

3. Consider enabling Supabase's built-in backups (Pro plan)

---

## Security Checklist Before Launch

- [ ] All env vars set in Vercel (not hardcoded)
- [ ] `LIVE_TRADING_ENABLED=false` confirmed in prod
- [ ] Supabase RLS policies active on all tables
- [ ] Service role key is server-side only (not in `NEXT_PUBLIC_*`)
- [ ] Admin route tested — non-admin users see "Access Denied"
- [ ] Risk disclaimer visible on all pages
- [ ] Compliance agent tested against regulated language

---

## Monitoring

- Vercel Analytics: enable in project settings
- Supabase logs: dashboard → Logs
- Anthropic usage: console.anthropic.com → Usage
- Alpaca paper account: alpaca.markets dashboard
