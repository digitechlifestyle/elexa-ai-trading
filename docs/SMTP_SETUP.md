# SMTP Setup — Resend (Free Tier)

Supabase's built-in email is rate-limited to 3/hour and lands in spam.
Replace it with Resend (3,000 emails/month free) so password reset and email
confirmation actually work.

## 10-Minute Setup

### 1. Create Resend Account

1. Go to https://resend.com/signup
2. Sign up with the email you want password resets sent from
3. Verify your email

### 2. Add a Domain (or use the shared one)

**Option A — Use Resend's shared sender (fastest):**
- Resend lets you send from `onboarding@resend.dev` immediately with no
  domain verification. Good enough for testing.

**Option B — Use your own domain (recommended for prod):**
1. In Resend dashboard: **Domains** → **Add domain**
2. Enter `elexaaitrading.com` (or whichever you own)
3. Add the SPF, DKIM, MX records Resend shows to your DNS host
4. Wait ~10 minutes for verification

### 3. Get an SMTP Username + Password

1. In Resend dashboard: **API Keys** → **Create API Key**
2. Name: `Supabase SMTP`, permission: **Sending access** only
3. Copy the key — looks like `re_xxxxxxxxxxxxxxxxxxxx`
4. This key is your SMTP password
5. SMTP username is the literal string `resend`

### 4. Configure Supabase

1. Go to https://supabase.com/dashboard/project/gkmtgcrtpmewjxcjogye/auth/templates
2. Click **SMTP Settings** (or **Authentication → Configuration → SMTP**)
3. Enable **Custom SMTP**
4. Fill in:
   - **Sender email:** `noreply@elexaaitrading.com` (or `onboarding@resend.dev`)
   - **Sender name:** `Elexa AI Trading`
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (STARTTLS)
   - **Username:** `resend`
   - **Password:** paste the API key from step 3
5. Click **Save**

### 5. Test

1. Sign out of the app
2. Go to https://elexa-ai-trading.vercel.app/forgot-password
3. Enter your email → Send reset link
4. Check inbox (and spam folder once)
5. Email should arrive within ~30 seconds

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Sender not authorised" | Verify the domain in Resend, or use `onboarding@resend.dev` |
| Email in spam | Add DKIM record to your DNS, or use your own domain |
| Rate limit hit | Free tier = 100/day. Upgrade Resend plan if needed |
| No email at all | Check Supabase logs (Auth → Logs) for SMTP errors |

## Cost

- **Resend Free:** 100 emails/day, 3,000/month — enough for hundreds of users
- **Resend Pro:** $20/month for 50,000 emails — only needed if you scale past free tier
