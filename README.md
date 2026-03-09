# Busy Beds - Hotel Coupon Membership System

A platform where travelers subscribe to access hotel discount coupons, generate unique coupons with QR codes, and redeem them at hotels.

## Stack

- **Frontend:** Next.js, TypeScript, TailwindCSS
- **Backend:** Node.js, Express.js, REST API
- **Database:** PostgreSQL
- **Auth:** JWT (travelers + hotel staff)

## Deployment (Auto-deploy on push)

Connect the repo to **Vercel** and **Railway** for automatic deploys on every `git push`.

### One-time setup

1. **Push to GitHub** – Commit and push this repo

2. **Railway (backend + DB)**
   - New project → Deploy from GitHub repo
   - Add PostgreSQL (New → Database → PostgreSQL)
   - Add service from same repo, set **Root Directory** to `backend`
   - Env vars: `DATABASE_URL` (from Postgres), `JWT_SECRET`, `FRONTEND_URL` (set after Vercel)
   - Schema runs automatically on each deploy via `npm run migrate`

3. **First-time seed** (run once):
   ```bash
   cd backend && railway run psql $DATABASE_URL -f ../database/seed.sql
   railway run npx tsx scripts/seed-admin.ts
   ```

4. **Vercel (frontend)**
   - Import repo, set **Root Directory** to `frontend`
   - Env: `NEXT_PUBLIC_API_URL` = Railway backend URL + `/api/v1`

5. **Update Railway** – Set `FRONTEND_URL` to your Vercel URL

---

## Setup (Local)

### 1. Database

Create a PostgreSQL database and run the schema:

```bash
createdb busybeds
psql busybeds -f database/schema.sql
psql busybeds -f database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

Create admin user (optional):

```bash
ADMIN_EMAIL=admin@busybeds.com ADMIN_PASSWORD=admin123 npx tsx scripts/seed-admin.ts
```

### 3. Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local
npm install
npm run dev
```

### 4. Run

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Features

- **Travelers:** Register, subscribe to plans (Basic/Standard/Premium), browse hotels, generate coupons with QR codes
- **Hotels:** Register (select hotel from list), log in, redeem coupons (only their own), view redemption stats
- **Admin:** Manage hotels, create hotel accounts, view users and coupons

## Coupon Flow

1. User subscribes and gets a plan (e.g. 10 coupons/month)
2. User browses hotels and clicks "Get Coupon"
3. System checks user limit + hotel limit, generates unique code + QR
4. User shows QR at hotel
5. Hotel staff logs in, scans QR, validates coupon belongs to their hotel, clicks Redeem
