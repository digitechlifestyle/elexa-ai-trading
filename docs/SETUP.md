# Elexa AI Trading — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm or npm
- Supabase account (free tier works)
- Alpaca Markets account (free paper trading account)
- Anthropic API key

---

## 1. Clone and Install

```bash
git clone https://github.com/digitechlifestyle/elexa-ai-trading.git
cd elexa-ai-trading
npm install
```

---

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (keep secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ALPACA_API_KEY` | alpaca.markets → Paper Trading account |
| `ALPACA_API_SECRET` | alpaca.markets → Paper Trading account |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` (paper) |
| `LIVE_TRADING_ENABLED` | **Must be `false`** until paper tests pass |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your domain (prod) |

---

## 3. Supabase Database

### Option A: Supabase CLI (recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B: Manual SQL

1. Go to Supabase dashboard → SQL Editor
2. Paste contents of `supabase/migrations/001_initial.sql`
3. Run

---

## 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Create First Admin User

1. Sign up at `/login` (creates a `user` role profile)
2. In Supabase SQL Editor, promote to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

---

## 6. Verify Paper Trading

1. Open Dashboard → Portfolio
2. Place a paper buy order (e.g., 1 share of AAPL)
3. Check Dashboard → Overview for the trade record
4. Verify the trade shows `is_paper: true` in Supabase

---

## Important: Live Trading Gate

`LIVE_TRADING_ENABLED` is `false` by default. **Do not set to `true`** until:

- [ ] Paper trading tests pass (see `docs/TESTING_CHECKLIST.md`)
- [ ] Legal review complete
- [ ] Alpaca live account configured with correct API keys
- [ ] `ALPACA_BASE_URL` changed to `https://api.alpaca.markets`
