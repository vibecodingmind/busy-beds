# Finalize Checklist – Busy Beds

Use this list to confirm everything is production-ready after domain and core features are in place.

---

## ✅ Already fixed in code

- **Email verification** – Backend now sends the verification email when user requests “Resend verification”. Frontend has `/verify-email` page so the link in the email works and marks the user as verified.

---

## 1. Environment & domain

- [ ] **Vercel**: `NEXT_PUBLIC_API_URL` = `https://api.busybeds.com/api/v1`, `NEXT_PUBLIC_SITE_URL` = `https://busybeds.com` (optional, for sitemap).
- [ ] **Railway**: `FRONTEND_URL` = `https://busybeds.com`, `API_URL` = `https://api.busybeds.com`, `DATABASE_URL`, `JWT_SECRET`.
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

---

## 4. Admin & content

- [ ] **Admin user**: At least one admin exists (e.g. via seed or `seed-admin.ts`).
- [ ] **Plans**: Subscription plans created and priced; Stripe/PayPal IDs set.
- [ ] **Hotels**: Real hotels added; hotel accounts created and approved where needed.
- [ ] **Admin → Settings**: Site name, support email, Google Maps key, Stripe/PayPal, etc. filled as needed.

---

## 5. Cron (coupon expiry reminders)

- [ ] **Cron secret**: `CRON_SECRET` (or `SEED_SECRET`) set on Railway.
- [ ] **Scheduler**: External cron (e.g. cron-job.org, Railway cron) hits `POST https://api.busybeds.com/api/v1/cron/coupon-expiry-reminders` with header `x-cron-secret: YOUR_SECRET` (or `?secret=YOUR_SECRET`) on the schedule you want (e.g. daily).

---

## 6. OAuth (optional)

- [ ] **Google**: In Google Cloud Console, redirect URI includes `https://api.busybeds.com/auth/google/callback`. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway.
- [ ] **Facebook**: Same idea for `https://api.busybeds.com/auth/facebook/callback` and Facebook App credentials.

---

## 7. Quick smoke tests

- [ ] **Site**: https://busybeds.com loads; login/register work.
- [ ] **API**: https://api.busybeds.com/health returns `{"status":"ok"}`.
- [ ] **Profile**: Change name/avatar; “Resend verification” sends email; link opens `/verify-email` and verifies.
- [ ] **Password**: Forgot password → email received → reset works.
- [ ] **Subscription**: Choose plan → Stripe or PayPal flow completes (test or live as intended).
- [ ] **Hotel**: Hotel login → redeem coupon flow works.

Once these are done, the app is finalized for production use.
