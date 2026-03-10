# Busy Beds – Deployment Guide

Step-by-step guide to deploy Busy Beds. Choose one:

- **Option A:** Vercel (frontend + backend) + Railway Postgres
- **Option B:** Railway (backend + Postgres) + Vercel (frontend)

---

## Auto Deploy

When Railway and Vercel are connected to your GitHub repo, **every push to `main` triggers automatic deployment**:

1. **Railway** – Deploys backend when you push to `main`
2. **Vercel** – Deploys frontend when you push to `main`

**To enable auto deploy:**
- **Railway:** New Project → Deploy from GitHub repo → select `busy-beds` → connect
- **Vercel:** Add New → Project → Import `busy-beds` from GitHub

No GitHub Actions needed; both platforms watch the repo and deploy on push.

---

## Option A: All on Vercel (frontend + backend)

Use this when Railway is down or you prefer a single platform. Database stays on Railway Postgres (or any Postgres provider).

### A1. Deploy backend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your `busy-beds` repo
3. Configure:
   - **Root Directory:** `backend`
   - **Framework Preset:** Other (or leave auto)
   - **Build Command:** (uses `backend/vercel.json` – runs `npm run build && npm run migrate`)
4. **Environment Variables:**
   - `DATABASE_URL` – your Postgres URL (Railway Postgres or other)
   - `JWT_SECRET` – `openssl rand -base64 32`
   - `FRONTEND_URL` – your frontend URL (e.g. `https://busy-beds.vercel.app`)
5. Deploy. Copy the backend URL (e.g. `https://busy-beds-backend-xxx.vercel.app`)

### A2. Deploy frontend on Vercel

1. **Add New** → **Project** → import same `busy-beds` repo again (second project)
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
3. **Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-BACKEND-URL.vercel.app/api/v1`
4. Deploy

### A3. Database

Use Railway Postgres (Part 2.2) or any Postgres provider. Put the connection string in `DATABASE_URL` on the backend project.

---

## Part 1: Push to GitHub (both options)

### 1.1 Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it `busy-beds` (or any name)
4. Choose **Public**
5. Do **not** initialize with README (you already have files)
6. Click **Create repository**

### 1.2 Push your code

Open Terminal and run:

```bash
cd "/Users/guteng/Documents/Busy Beds"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial Busy Beds MVP"

# Add your GitHub repo as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/busy-beds.git

# Push to main branch
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME/busy-beds` with your actual GitHub username and repo name.

---

## Option B: Railway backend + Vercel frontend

### Part 2: Deploy Backend + Database on Railway

### 2.1 Create Railway account and project

1. Go to [railway.app](https://railway.app)
2. Click **Login** → sign in with **GitHub**
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Choose your `busy-beds` repository
6. Railway will create a service (you’ll configure it next)

### 2.2 Add PostgreSQL database

1. In your Railway project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Wait for PostgreSQL to provision
4. Click the PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value (you’ll use it for the backend)

### 2.3 Configure the backend service and connect the database

**Step A: Settings**
1. Click your **backend service** (the one created from GitHub, e.g. "busy-beds")
2. Go to **Settings**
3. **Root Directory:** Set to `backend` (required)

**Step B: Connect database (critical)**
1. Go to **Variables** tab
2. Click **+ New Variable** → **Add Reference**
3. Select your **PostgreSQL** service
4. Choose **DATABASE_URL** from the dropdown
5. Click **Add** – this links the database to your backend

**Step C: Add other variables**
6. Click **+ New Variable** → **Add Variable** (plain, not reference)
7. Add:
   - `JWT_SECRET` = output of `openssl rand -base64 32`
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://busy-beds.vercel.app`) – add after Part 3
   - `SEED_SECRET` = output of `openssl rand -hex 16` (for one-time seed via API when local DB connection fails)

**Step D: Deploy**
8. Railway deploys automatically when you save. Or click **Deploy** in the top right.

**Verify connection:** Backend service → **Variables** → you should see `DATABASE_URL` with a value like `postgresql://...@postgres.railway.internal:5432/railway`. If it's there, the database is connected.

### 2.4 Get your backend URL

1. Click the backend service
2. Go to **Settings** → **Networking**
3. Click **Generate Domain**
4. Copy the URL (e.g. `https://busy-beds-backend-production.up.railway.app`)

### 2.5 Run seed and create admin (one-time)

**Note:** The Railway CLI does NOT connect the database. The connection is done in Step 2.3 (Add Reference → DATABASE_URL). The CLI is only for running one-off commands from your Mac.

Use your **backend service name** (from `railway link`). Run `railway status` to see it. If you only have one service, omit `-s busy-beds`.

Install Railway CLI (optional – only for running seed/admin from your computer):

```bash
npm install -g @railway/cli
```

Then:

```bash
cd "/Users/guteng/Documents/Busy Beds"

# Link to your Railway project (follow prompts)
railway link

# Migrate + seed + test users (see TEST-USERS.md for credentials)
railway run -s busy-beds npm run seed:all
```

If `-s busy-beds` gives "Service not found", run without `-s`:
```bash
railway run npm run seed:all
```

**If Railway CLI times out (ETIMEDOUT):** Use the seed API instead. Add `SEED_SECRET` to Railway variables, deploy, then call:
```
https://YOUR-BACKEND-URL/api/v1/seed?secret=YOUR_SEED_SECRET
```

If you don’t use the CLI, run the SQL and script from the Railway dashboard:

- **PostgreSQL** → **Connect** → use a client (TablePlus, pgAdmin, etc.) to run `database/seed.sql`
- For admin: run `npx tsx scripts/seed-admin.ts` locally with `DATABASE_URL` set to your Railway Postgres URL

---

### Part 3: Deploy Frontend on Vercel

### 3.1 Create Vercel project

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** or **Login** → use **GitHub**
3. Click **Add New** → **Project**
4. Import your `busy-beds` repository
5. Before deploying, configure:

### 3.2 Configure build settings

| Setting          | Value    |
|------------------|----------|
| Framework Preset | Next.js  |
| Root Directory   | `frontend` |

### 3.3 Add environment variable

1. Expand **Environment Variables**
2. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://YOUR-RAILWAY-URL.up.railway.app/api/v1`  
     (use the backend URL from Step 2.4)
3. Click **Deploy**

### 3.4 Get your Vercel URL

After deploy, copy the URL (e.g. `https://busy-beds.vercel.app`).

---

### Part 4: Connect frontend and backend

### 4.1 Set FRONTEND_URL on Railway

1. In Railway, open your **backend service**
2. Go to **Variables**
3. Add or update `FRONTEND_URL` with your Vercel URL (e.g. `https://busy-beds.vercel.app`)
4. Save; Railway will redeploy

### 4.2 Test the app

1. Open your Vercel URL
2. Register a new user
3. Subscribe to a plan
4. Browse hotels and generate a coupon
5. Log in as admin (if you created one) and add hotels

---

### Part 5: Create hotel account (for redemption)

1. Log in as admin
2. Go to **Admin** → **Hotels**
3. Add a hotel (or use a seeded one)
4. Click **Edit** on a hotel
5. In **Create Hotel Account**, enter email, password, name
6. Click **Create Account**
7. Log out and go to **Hotel Login** to test redemption

---

## Troubleshooting

### Backend not starting

- Check Railway logs for errors
- Ensure `DATABASE_URL` is set and references the Postgres service
- Ensure `JWT_SECRET` is set

### CORS errors in browser

- Set `FRONTEND_URL` on Railway to your exact Vercel URL (including `https://`)
- Redeploy the backend after changing variables

### Frontend can’t reach API

- Confirm `NEXT_PUBLIC_API_URL` ends with `/api/v1`
- Confirm the Railway backend has a public domain
- Check browser Network tab for the failing request

### Migration fails

- Ensure the backend service Root Directory is `backend`
- Schema is in `backend/scripts/schema.init.sql`
- Inspect Railway build logs for the migration step

### Railpack "could not determine how to build"

- Set Root Directory to `backend` in Railway Settings
- Backend has `nixpacks.toml` and `railway.toml` for explicit build config

---

## Summary

| Option | Frontend | Backend | Database |
|--------|----------|---------|----------|
| A      | Vercel   | Vercel  | Railway Postgres (or any) |
| B      | Vercel   | Railway | Railway Postgres |

After setup, pushing to `main` triggers automatic deploys.
