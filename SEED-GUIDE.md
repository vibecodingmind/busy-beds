# Busy Beds – Database Seed Guide

Step-by-step guide to seed your database (local or production).

---

## What gets seeded

| Step | What it does |
|------|--------------|
| **1. Migrate** | Creates/updates tables (schema) |
| **2. Seed** | Adds subscription plans + 3 sample hotels (Grand Plaza, Seaside Resort, Mountain Lodge) |
| **3. Test users** | Adds admin, guest, and hotel owner accounts (see credentials below) |

---

## Option A: Local development

### Prerequisites

- PostgreSQL running (local or cloud)
- `DATABASE_URL` – your Postgres connection string

### Step 1: Get your DATABASE_URL

**If using local Postgres:**
```bash
# Example (adjust user, db name as needed)
export DATABASE_URL="postgresql://postgres:password@localhost:5432/busybeds"
```

**If using Railway Postgres:**
1. Railway Dashboard → Your project → PostgreSQL service
2. Variables tab → copy `DATABASE_URL` (or use "Connect" → "Public URL")
3. It looks like: `postgresql://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway`

### Step 2: Run the seed

```bash
cd "/Users/guteng/Documents/Busy Beds/backend"

# Full seed (migrate + plans/hotels + test users)
DATABASE_URL="postgresql://your-connection-string" npm run seed:all
```

**Or set it once, then run:**
```bash
cd backend
export DATABASE_URL="postgresql://postgres:password@localhost:5432/busybeds"
npm run seed:all
```

### Step 3: Verify

- Start the backend: `npm run dev`
- Start the frontend: `cd ../frontend && npm run dev`
- Open the app, log in with: `guest@busybeds.com` / `guest123`

---

## Option B: Production (Railway)

### Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli) installed: `npm install -g @railway/cli`
- Project linked: `railway link` (from project root)

### Step 1: Link to Railway (one-time)

```bash
cd "/Users/guteng/Documents/Busy Beds"
railway link
# Select your project and environment
```

### Step 2: Run seed

```bash
railway run npm run seed:all
```

This uses the `DATABASE_URL` from your Railway project (no need to set it manually).

### Step 3: Verify

- Open your deployed app
- Log in with `admin@busybeds.com` / `admin123` or `guest@busybeds.com` / `guest123`

---

## Run steps separately

If you prefer to run each step:

```bash
cd backend

# 1. Create/update tables
DATABASE_URL="..." npm run migrate

# 2. Add plans + hotels
DATABASE_URL="..." npm run seed

# 3. Add test users only
DATABASE_URL="..." npm run seed:test-users
```

---

## Test account credentials

| Role | Email | Password |
|------|-------|----------|
| Guest | guest@busybeds.com | guest123 |
| Admin | admin@busybeds.com | admin123 |
| Hotel | hotel@busybeds.com | hotel123 |

Hotel account is for **Grand Plaza Hotel** (from seed).

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `DATABASE_URL not set` | Export or pass `DATABASE_URL` before the command |
| `Connection refused` | Check Postgres is running and the URL is correct |
| `relation "users" does not exist` | Run `npm run migrate` first |
| `Service not found` (Railway) | Run `railway link` and select the correct project |
| Duplicate key / conflict | Seed is idempotent for plans; re-running test-users updates passwords |

---

## Option C: Seed via API (when direct DB connection fails)

If you can't connect from your Mac (ETIMEDOUT), use the backend running on Railway:

### 1. Add SEED_SECRET to Railway

1. Railway → **busy-beds** service → **Variables**
2. Add: `SEED_SECRET` = `your-random-secret` (e.g. run `openssl rand -hex 16`)
3. Redeploy if needed

### 2. Call the seed endpoint

Replace `YOUR_BACKEND_URL` and `YOUR_SEED_SECRET`:

```bash
curl "https://YOUR-BACKEND-URL.up.railway.app/api/v1/seed?secret=YOUR_SEED_SECRET"
```

Or open in browser: `https://your-backend.railway.app/api/v1/seed?secret=YOUR_SEED_SECRET`

Expected response: `{"success":true,"message":"Seed completed..."}`

### 3. Seed reviews only (add a few reviews to all properties)

If you already have hotels and only need review data:

```bash
curl "https://YOUR_BACKEND_URL/api/v1/seed/reviews?secret=YOUR_SEED_SECRET"
```

Or open in browser: `https://your-backend.railway.app/api/v1/seed/reviews?secret=YOUR_SEED_SECRET`

Uses the same `SEED_SECRET` as above. Creates reviewer users and 3–4 reviews per hotel.

---

## Quick reference

| Context | Command |
|---------|---------|
| Local (inline) | `DATABASE_URL="postgresql://..." npm run seed:all` |
| Local (exported) | `export DATABASE_URL="..."; npm run seed:all` |
| Railway | `railway run npm run seed:all` |
