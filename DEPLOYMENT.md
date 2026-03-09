# Busy Beds – Deployment Guide

Step-by-step guide to deploy Busy Beds to GitHub, Railway (backend + database), and Vercel (frontend).

---

## Part 1: Push to GitHub

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

## Part 2: Deploy Backend + Database on Railway

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

### 2.3 Configure the backend service

1. Click your **backend service** (the one created from GitHub)
2. Go to **Settings**
3. Set **Root Directory** to `backend`
4. Go to **Variables** and add:

| Variable       | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| `DATABASE_URL` | Paste from PostgreSQL service (or use **Add Reference** → Postgres)  |
| `JWT_SECRET`   | Generate one: `openssl rand -base64 32` in Terminal                  |
| `FRONTEND_URL` | Leave empty for now; add your Vercel URL after Part 3                |

5. Click **Deploy** (or it will deploy automatically)

### 2.4 Get your backend URL

1. Click the backend service
2. Go to **Settings** → **Networking**
3. Click **Generate Domain**
4. Copy the URL (e.g. `https://busy-beds-backend-production.up.railway.app`)

### 2.5 Run seed and create admin (one-time)

Install Railway CLI (optional but useful):

```bash
npm install -g @railway/cli
```

Then:

```bash
cd "/Users/guteng/Documents/Busy Beds"

# Link to your Railway project (follow prompts)
railway link

# Run seed (subscription plans + sample hotels)
railway run -s busy-beds-backend psql $DATABASE_URL -f database/seed.sql

# Create admin user (password: admin123)
cd backend && railway run -s busy-beds-backend npx tsx scripts/seed-admin.ts
```

If you don’t use the CLI, run the SQL and script from the Railway dashboard:

- **PostgreSQL** → **Connect** → use a client (TablePlus, pgAdmin, etc.) to run `database/seed.sql`
- For admin: run `npx tsx scripts/seed-admin.ts` locally with `DATABASE_URL` set to your Railway Postgres URL

---

## Part 3: Deploy Frontend on Vercel

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

## Part 4: Connect frontend and backend

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

## Part 5: Create hotel account (for redemption)

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
- Check that `database/schema.init.sql` exists in the repo
- Inspect Railway build logs for the migration step

---

## Summary

| Platform   | Purpose                    | URL / config                          |
|-----------|----------------------------|---------------------------------------|
| GitHub    | Source code                | Your repo URL                         |
| Railway   | Backend + PostgreSQL       | Backend URL + `DATABASE_URL`         |
| Vercel    | Frontend                   | Frontend URL                          |

After setup, pushing to `main` will trigger automatic deploys on both Railway and Vercel.
