# Elexa AI Trading — Deploy to Production

## Quick Start (15 minutes)

### 1. Verify GitHub push

In your Terminal:
```bash
cd /Users/joerobertson/elexa-ai-trading
git log --oneline -3
```

You should see recent commits. If not, run:
```bash
git remote -v
git push -u origin main
```

### 2. Deploy to Vercel

**Go here:** https://vercel.com/dashboard

1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Search for **`elexa-ai-trading`**
4. Select the repo → click **"Import"**
5. Framework: **Next.js** (auto-detected ✓)
6. Click **"Deploy"** (don't change settings yet)

**Wait 2-3 minutes.** You'll see a green ✓ and a URL like `elexa-ai-trading-abc123.vercel.app`

### 3. Add environment variables

While Vercel is deploying:

1. In Vercel dashboard, find your project → **Settings** → **Environment Variables**
2. Add these (from your `.env.local` — see `.env.example` for format):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your-key-here
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
ALPACA_API_KEY=your-alpaca-key-here
ALPACA_API_SECRET=your-alpaca-secret-here
ALPACA_BASE_URL=https://paper-api.alpaca.markets
LIVE_TRADING_ENABLED=false
NEXT_PUBLIC_APP_URL=https://elexa-ai-trading-abc123.vercel.app
```

⚠️ **Never commit real API keys to GitHub.** Vercel env vars are private.

3. Click **"Save"**
4. Click **"Redeploy"** (top right)

### 4. Connect your domain (optional, for later)

Once it's working on the Vercel URL, you can add your custom domain:

1. **In Vercel:** Settings → Domains → Add `elexaaitrading.com`
2. **Update DNS at your registrar** (GoDaddy, Namecheap, etc.):
   ```
   CNAME  @    cname.vercel-dns.com
   CNAME  www  cname.vercel-dns.com
   ```
3. Wait ~10 minutes for DNS to propagate
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to `https://elexaaitrading.com`

---

## Test it's working

After deployment + environment variables are set:

1. Go to your Vercel URL (or `elexaaitrading.com` if domain is set)
2. You should see the landing page with the Elexa logo
3. Click **"Open Paper Dashboard"** → **"Sign up"** 
4. Create a test account
5. Place a paper trade (AAPL, 10 shares, Buy)
6. Should see ✅ success message

**If it works → you're live on the internet.** 🚀

---

## What's live right now

- ✅ Landing page (public)
- ✅ Pricing page (public)
- ✅ Disclaimer (public)
- ✅ Blog (public, 3 starter posts)
- ✅ Sign up / Sign in (Supabase Auth)
- ✅ Dashboard (paper trading, Alpaca + Kraken)
- ✅ Agents (AI analysis)
- ✅ Risk management (limits enforced)

---

## What's NOT yet (add later based on user feedback)

- Binance, Bitget, KuCoin adapters (easy to add)
- User settings (to store exchange API keys)
- Export trade history (CSV)
- Mobile app
- Live trading (requires legal review first)

---

## Support

If Vercel deployment fails:
1. Check env vars are spelled exactly right
2. Check Supabase is online (go to supabase.com/dashboard)
3. Check GitHub repo is public (Settings → Access)
4. Try redeploying: **Deployments → More → Redeploy**

**Stuck?** Post an issue: https://github.com/digitechlifestyle/elexa-ai-trading/issues
