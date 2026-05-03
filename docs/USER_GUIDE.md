# Elexa AI Trading — User Guide

**Welcome to Elexa.** This guide gets you trading in 10 minutes.

---

## ⚠️ Critical Disclaimers

**This is a paper trading research tool. Not financial advice.**
- All trades are simulated (no real money)
- Past performance ≠ future results
- Never trade with money you can't afford to lose
- Read the [full disclaimer](https://elexaaitrading.com/disclaimer)

---

## Step 1: Sign Up (2 min)

1. Go to **http://elexaaitrading.com** (or localhost:3000 for testing)
2. Click **"Open Paper Dashboard"** → **"Sign up"**
3. Enter your email + password (8+ chars)
4. Click **"Create account"**
5. You land on your **Dashboard** ✅

---

## Step 2: Choose an Exchange (1 min)

On the **Portfolio** page, you'll see two options:

### Option A: Trade Stocks (Alpaca)
- **Symbols:** AAPL, GOOGL, MSFT, TSLA, etc.
- **Qty:** Any amount
- Uses Alpaca's paper trading API

### Option B: Trade Crypto (Kraken)
- **Symbols:** BTC, ETH, XRP, SOL, etc.
- **Qty:** 0.1, 0.5, 1, etc. (fractional OK)
- Uses Kraken's API

**Pick one. Both are free and safe (paper-only).**

---

## Step 3: Place Your First Paper Trade (3 min)

1. Select your exchange (Alpaca or Kraken)
2. Enter a **symbol** (e.g., AAPL for stocks, BTC for crypto)
3. Enter a **quantity** (e.g., 10 for stocks, 0.5 for crypto)
4. Click **Buy** or **Sell**
5. Click **"Submit Paper Order"**
6. You'll see ✅ **"Paper buy order submitted"**

**That's it.** Your trade is now in the system (simulated).

---

## Step 4: View Your Trades

### Dashboard → Overview
- See your most recent trades
- See AI agent activity

### Dashboard → Portfolio
- Place more trades
- Change exchanges anytime

### Dashboard → Journal
- Write notes on your trading decisions
- Build a research record

### Dashboard → Agents
- Trigger AI analysis manually
- Quant Agent: "Analyze AAPL momentum"
- Compliance Agent: "Is this language compliant?"
- (See `src/lib/agents/` for what each does)

---

## Step 5: Risk Management (Important)

**Your trades are protected by automatic limits:**

- **Max position size:** $5,000 (per trade)
- **Max daily loss:** $500 (cumulative per day)
- **Max open positions:** 10 (at a time)
- **Stop-loss:** 5% (automatic exit if price drops 5%)

**If you hit a limit, you'll see an error.** Limits reset daily at midnight.

---

## Troubleshooting

### "Error: Could not fetch price for AAPL"
- Symbol might not exist on that exchange
- Try: AAPL (stocks), BTC (crypto)
- Switch exchanges if needed

### "Error: Failed to log trade"
- Your session expired
- Sign out, sign back in, try again

### "Daily loss limit of $500 reached"
- You've lost $500 today on paper trades
- Try again tomorrow
- (This is by design — paper trading teaches risk discipline)

### "You're not authenticated"
- Sign up/sign in first
- Make sure you're on the authenticated dashboard, not landing page

---

## What's Next?

### Short term (today)
1. Place 3-5 paper trades
2. Use different symbols (stocks + crypto)
3. Check your Dashboard overview

### Medium term (this week)
1. Use the **Journal** tab to document your thinking
2. Try the **Agents** tab to see AI analysis
3. Test risk limits (place orders near your max)

### Long term (month 1)
1. Develop a paper trading strategy
2. Log all decisions in the Journal
3. Track your simulated P&L
4. Feedback: tell us what's missing

---

## FAQ

**Q: Can I lose real money?**
A: No. All trades are simulated. No real money ever moves.

**Q: Can I export my trade history?**
A: Not yet — coming soon. For now, screenshot your Dashboard.

**Q: Why do I need to pick an exchange?**
A: Different exchanges offer different assets (stocks vs crypto). You're building a system that supports both.

**Q: What if I find a bug?**
A: Email feedback@elexaaitrading.com or post on our GitHub issues: https://github.com/digitechlifestyle/elexa-ai-trading/issues

**Q: Is this a broker?**
A: No. We're a research/education tool. You connect your own exchange API keys (coming soon).

---

## Support

- **Documentation:** https://github.com/digitechlifestyle/elexa-ai-trading/docs
- **Issues:** https://github.com/digitechlifestyle/elexa-ai-trading/issues
- **Contact:** feedback@elexaaitrading.com

---

**Start paper trading now. Build your research record. Never risk real money until you're confident.**
