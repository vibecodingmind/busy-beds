# Finalize Checklist – Busy Beds

Use this list to confirm everything is production-ready after domain and core features are in place.

---

## ✅ Already fixed in code

- **Email verification** – Backend now sends the verification email when user requests “Resend verification”. Frontend has `/verify-email` page so the link in the email works and marks the user as verified.

---

## 1. Environment & domain

- [ ] **Vercel**: `NEXT_PUBLIC_API_URL` = `https://api.busybeds.com/api/v1`, `NEXT_PUBLIC_SITE_URL` = `https://busybeds.com` (optional, for sitemap).
- [ ] **Railway**: `FRONTEND_URL` = `https://busybeds.com`, `API_URL` = `https://api.busybeds.com`, `DATABASE_URL`, `JWT_SECRET`. Optional: `JWT_EXPIRES_IN` = `7d` so admin sessions last longer (default is 15m).
- [ ] **ResellerClub DNS**: A + CNAME for Vercel, CNAME for Railway (`api`), MX/TXT for Resend (if using custom domain for email).

---

## 2. Email (Resend)

- [ ] **Resend**: Domain `busybeds.com` added and verified; MX/TXT records in DNS.
- [ ] **Railway**: `RESEND_API_KEY` set; `EMAIL_FROM` = `Busy Beds <hello@busybeds.com>` (or your chosen address).
- [ ] **Test**: Register a new user → check welcome email; trigger “Resend verification” from profile → check verification email; trigger “Forgot password” → check reset email.

---

## 3. Payments

- [ ] **Stripe**: Live keys in Railway (or Admin Settings); webhook URL `https://api.busybeds.com/api/v1/stripe/webhook`; each plan has `stripe_price_id` in Admin → Plans.
- [ ] **PayPal**: Live client ID/secret in Railway (or Admin); each plan has `paypal_plan_id` in Admin → Plans; optional webhook `https://api.busybeds.com/api/v1/paypal/webhook` for BILLING.SUBSCRIPTION.*.
- [ ] **Referral withdrawals**: In Admin → Settings set **Withdraw min amount** / **Withdraw max amount per request**. In Admin → Referral withdrawals, review and mark payout requests as paid after you send money via bank / mobile money / PayPal.

---

## 4. Admin & content

- [ ] **Admin user**: At least one admin exists. **Easiest:** set `SEED_SECRET` in Railway, then run once (see **Create admin via API** below).
- [ ] **Plans**: Subscription plans created and priced; Stripe/PayPal IDs set.
- [ ] **Hotels**: Real hotels added; hotel accounts created and approved where needed.
- [ ] **Admin → Settings**: Site name, support email, Google Maps key, Stripe/PayPal, etc. filled as needed.
- [ ] **Maintenance mode** (optional): In Admin → Settings, set **Maintenance mode** to `true` to show “We'll be back soon” to non-admins; set back to `false` when done.


- **Create admin via API** (no local DB needed): In Railway, set `SEED_SECRET` to any random string (e.g. `openssl rand -hex 16`). After deploy, run once (replace `YOUR_SEED_SECRET` and your API URL):
  ```bash
  curl -X POST "https://api.busybeds.com/api/v1/seed/admin?secret=YOUR_SEED_SECRET" -H "Content-Type: application/json" -d '{"email":"vibecodingmind@gmail.com","password":"G@t@ng@T@E511713"}'
  ```
  Then log in at https://busybeds.com/login and open https://busybeds.com/admin.

---

## 5. Cron (coupon expiry reminders & weekly report)

- [ ] **Cron secret**: `CRON_SECRET` (or `SEED_SECRET`) set on Railway.
- [ ] **48h reminders**: `POST /api/v1/cron/coupon-expiry-reminders` with `x-cron-secret` or `?secret=` (e.g. daily).
- [ ] **1-day reminders** (for users who opted in): `POST /api/v1/cron/coupon-expiry-reminders-1d` (e.g. daily).
- [ ] **Weekly admin report**: `POST /api/v1/cron/weekly-report` (e.g. every Monday) – sends new signups, redemptions, active subscriptions to `support_email`. Ensure Admin → Settings has **Support / contact email** set.

---

## 6. WhatsApp (optional)

- [ ] **Meta Cloud API**: To send coupon reminders via WhatsApp, follow [docs/WHATSAPP-SETUP.md](WHATSAPP-SETUP.md). In Admin → Settings set **WhatsApp Access Token**, **WhatsApp Phone Number ID**, **WhatsApp template name**, and **Enable WhatsApp reminders** = `true`. Users add phone on profile and check “Receive coupon reminders on WhatsApp”. Schema adds `users.whatsapp_opt_in` automatically on deploy.

---

## 7. OAuth (optional)

- [ ] **FRONTEND_URL**: In Railway, set `FRONTEND_URL` = `https://busybeds.com` (no trailing slash). Callbacks use the frontend domain.
- [ ] **Google**: In Google Cloud Console → Credentials → your OAuth client → **Authorized redirect URIs**, add exactly: `https://busybeds.com/auth/google/callback`. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway (or Admin → Settings → OAuth).
- [ ] **Facebook**: In Meta for Developers → Facebook Login → Settings → **Valid OAuth Redirect URIs**, add exactly: `https://busybeds.com/auth/facebook/callback`. Under **App Domains** add `busybeds.com` (and `api.busybeds.com` if needed). Turn on **Client OAuth Login** and **Web OAuth Login**. Set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in Railway (or Admin → Settings → OAuth).
- [ ] **LinkedIn**: In [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → your app → **Auth** → **Authorized redirect URLs**, add exactly: `https://busybeds.com/auth/linkedin/callback`. Add product **Sign In with LinkedIn using OpenID Connect**. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Railway (or Admin → Settings → OAuth).
- [ ] **If you see redirect or “URL Blocked” errors**: See [docs/OAUTH-REDIRECT-FIX.md](OAUTH-REDIRECT-FIX.md).

---

## 8. Quick smoke tests

- [ ] **Site**: https://busybeds.com loads; login/register work.
- [ ] **API**: https://api.busybeds.com/health returns `{"status":"ok"}`.
- [ ] **Profile**: Change name/avatar; “Resend verification” sends email; link opens `/verify-email` and verifies.
- [ ] **Password**: Forgot password → email received → reset works.
- [ ] **Subscription**: Choose plan → Stripe or PayPal flow completes (test or live as intended).
- [ ] **Hotel**: Hotel login → redeem coupon flow works.

Once these are done, the app is finalized for production use.
