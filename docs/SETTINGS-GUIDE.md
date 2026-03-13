# Busy Beds – Complete Settings Guide

Step-by-step guide to configure all settings for a fully functional deployment.

---

## Part 1: Railway (Backend)

### 1.1 Project Setup

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your `busy-beds` repo
3. Add **PostgreSQL** (click **+ New** → **Database** → **PostgreSQL**)
4. Click your **backend service** → **Settings** → set **Root Directory** = `backend`
5. **Settings** → **Networking** → **Generate Domain** (copy the URL, e.g. `https://busy-beds-xxx.up.railway.app`)

### 1.2 Required Variables

| Variable | Value | How to add |
|----------|-------|------------|
| `DATABASE_URL` | — | **Add Reference** → PostgreSQL service → `DATABASE_URL` |
| `JWT_SECRET` | Random string | Run: `openssl rand -base64 32` |
| `FRONTEND_URL` | Your Vercel URL | e.g. `https://busy-beds.vercel.app` (add after Part 2) |

### 1.3 Stripe (Payments + Referral Payouts)

Required for subscription payments and referral rewards.

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | See [1.4 Stripe Webhook](#14-stripe-webhook) below |

### 1.4 Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. **Endpoint URL:** `https://YOUR-RAILWAY-URL/api/v1/stripe/webhook`
3. **Events to send:**  
   - `checkout.session.completed`  
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`  
   - `account.updated` (optional, for Connect)
4. Click **Add endpoint** → copy the **Signing secret** (`whsec_...`)
5. Add to Railway: `STRIPE_WEBHOOK_SECRET` = that signing secret

### 1.5 Optional Variables

| Variable | Purpose |
|----------|---------|
| `SEED_SECRET` | For one-time seed: `GET /api/v1/seed?secret=YOUR_SEED_SECRET` (use when Railway CLI can't connect) |
| `RESEND_API_KEY` | Welcome + hotel approval emails. Get from [resend.com](https://resend.com) |
| `EMAIL_FROM` | Sender address, e.g. `Busy Beds <noreply@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth login |
| `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET` | Facebook OAuth login |
| `API_URL` | Backend base URL for OAuth callbacks, e.g. `https://your-backend.up.railway.app` |
| `CRON_SECRET` | Auth for cron endpoints (coupon expiry reminders) – or reuse `SEED_SECRET` |
| `WITHDRAW_MIN_AMOUNT` | **Referral withdrawals**: minimum amount a user can request (e.g. `10` for $10). |
| `WITHDRAW_MAX_AMOUNT` | **Referral withdrawals**: maximum amount per single request (e.g. `500` for $500). |

---

## Part 2: Vercel (Frontend)

### 2.1 Project Setup

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your `busy-beds` repo
3. **Root Directory:** `frontend`
4. **Framework:** Next.js (auto-detected)

### 2.2 Required Variable

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL/api/v1` (must end with `/api/v1`) |

### 2.3 Optional Variable

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL for sitemap. Defaults to `https://busybeds.com` |

---

## Part 3: Stripe Dashboard (Plans + Connect)

### 3.1 Create Products & Prices

1. [Stripe Dashboard](https://dashboard.stripe.com/products) → **Add product**
2. Create one product per plan (e.g. Basic, Standard, Premium)
3. Add a **recurring price** (monthly/yearly)
4. Copy each **Price ID** (starts with `price_`)

### 3.2 Link Prices to Plans

After seeding (Part 4), go to **Admin** → **Plans** (login as admin):

- Edit each plan
- Paste the matching `stripe_price_id` (e.g. `price_1ABC123...`)
- Save

Or update directly in the database if you have access.

### 3.3 Stripe Connect (Referral Payouts)

1. [Stripe Dashboard](https://dashboard.stripe.com/connect/accounts/overview) → **Get started** with Connect
2. Choose **Express** accounts (simplest for referrers)
3. Complete platform onboarding
4. Your `STRIPE_SECRET_KEY` is for the Connect platform – no extra config needed

### 3.4 PayPal (Subscriptions)

You can offer both Stripe and PayPal on subscription plans.

| Variable | Where to get it |
|----------|-----------------|
| `PAYPAL_CLIENT_ID` | [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) → My Apps & Credentials → your app → Client ID |
| `PAYPAL_CLIENT_SECRET` | Same app → Secret |
| `PAYPAL_SANDBOX` | Set to `true` for sandbox (testing); omit or `false` for live |

1. Add the variables to Railway (backend).
2. In PayPal: create a **Product** and a **Subscription plan** (billing cycle, price). Copy the **Plan ID** (e.g. `P-xxx`).
3. In **Admin → Plans**, edit the plan and set **PayPal Plan ID** to that Plan ID.
4. (Optional) For webhooks: [PayPal Webhooks](https://developer.paypal.com/dashboard/webhooks) → Add webhook → URL: `https://YOUR-RAILWAY-URL/api/v1/paypal/webhook` → subscribe to `BILLING.SUBSCRIPTION.*` events. Without webhooks, subscriptions are still created when the user returns from PayPal; webhooks improve reliability for cancellations and renewals.

---

## Part 4: One-Time Seed

### Option A: Railway CLI

```bash
cd "/Users/guteng/Documents/Busy Beds"
npm install -g @railway/cli
railway link    # Select your project
railway run npm run seed:all
```

### Option B: Seed API (if CLI times out)

1. Add `SEED_SECRET` to Railway (e.g. `openssl rand -hex 16`)
2. Deploy
3. Visit: `https://YOUR-RAILWAY-URL/api/v1/seed?secret=YOUR_SEED_SECRET`
4. This runs migration + seed (plans, hotels, test users)

### Option C: Create Admin Manually

```bash
cd backend
DATABASE_URL="postgresql://..." ADMIN_EMAIL=admin@yoursite.com ADMIN_PASSWORD=YourSecurePassword npx tsx scripts/seed-admin.ts
```

Use your Railway Postgres URL (from Railway → PostgreSQL → Connect → Connection URL).

---

## Part 5: Connect Frontend & Backend

1. **Vercel** → Your project → **Settings** → **Environment Variables**  
   - Add `NEXT_PUBLIC_API_URL` = `https://YOUR-RAILWAY-URL/api/v1`
2. **Railway** → Backend service → **Variables**  
   - Add `FRONTEND_URL` = `https://YOUR-VERCEL-URL.vercel.app`
3. Redeploy both if needed

---

## Part 6: Verify

| Check | URL / Action |
|-------|--------------|
| Backend health | `https://YOUR-RAILWAY-URL/health` → `{"status":"ok"}` |
| Frontend loads | Open Vercel URL |
| Register | Create a test user |
| Subscribe | Requires plans with `stripe_price_id` and/or `paypal_plan_id` set (Admin → Plans) |
| Admin | Login with admin credentials from seed |
| Hotel redemption | Create hotel account via Admin → Hotels → Edit → Create Hotel Account |

---

## Quick Reference

### Railway (minimum to function)

```
DATABASE_URL     → Add Reference (PostgreSQL)
JWT_SECRET       → openssl rand -base64 32
FRONTEND_URL     → https://your-app.vercel.app
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID          # optional, for PayPal subscriptions
PAYPAL_CLIENT_SECRET
# PAYPAL_SANDBOX=true      # use sandbox for testing
```

### Vercel (minimum)

```
NEXT_PUBLIC_API_URL → https://your-backend.up.railway.app/api/v1
```

### After seed

- Set `stripe_price_id` and/or `paypal_plan_id` on each plan (Admin → Plans)
- Add hotels if not seeded
- Create hotel accounts for redemption testing
