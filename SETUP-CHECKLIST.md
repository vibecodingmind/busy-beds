# Busy Beds – Setup Checklist

Use this checklist to ensure GitHub, Railway, and Vercel work together.

---

## 1. GitHub

- [ ] Repo pushed to `main`
- [ ] Railway and Vercel connected to the repo (auto-deploy on push)

---

## 2. Railway (Backend)

**Service settings:**
- [ ] Root Directory = `backend`
- [ ] Networking → Generate Domain (copy the URL)

**Variables (backend service):**
- [ ] `DATABASE_URL` = Add Reference → PostgreSQL → DATABASE_URL
- [ ] `JWT_SECRET` = `openssl rand -base64 32`
- [ ] `FRONTEND_URL` = `https://YOUR-VERCEL-URL.vercel.app`

**Verify:** Open `https://YOUR-RAILWAY-URL/health` → should return `{"status":"ok"}`

---

## 3. Vercel (Frontend)

**Project settings:**
- [ ] Root Directory = `frontend`
- [ ] Framework = Next.js

**Environment variables:**
- [ ] `NEXT_PUBLIC_API_URL` = `https://YOUR-RAILWAY-URL/api/v1`

**Verify:** Open `https://YOUR-VERCEL-URL.vercel.app` → app loads

---

## 4. Connect them

| From | To | Variable |
|------|-----|----------|
| Vercel | Railway | `NEXT_PUBLIC_API_URL` = Railway backend URL + `/api/v1` |
| Railway | Vercel | `FRONTEND_URL` = Vercel URL (for CORS) |

---

## 5. One-time: Seed database

```bash
cd "/Users/guteng/Documents/Busy Beds"
export DATABASE_URL="postgresql://...YOUR_RAILWAY_PUBLIC_POSTGRES_URL..."
node backend/scripts/migrate.js
node backend/scripts/seed.js
cd backend && npx tsx scripts/seed-admin.ts
```

---

## Quick reference

| Platform | URL | Key config |
|----------|-----|------------|
| GitHub | github.com/vibecodingmind/busy-beds | - |
| Railway | *.up.railway.app | Root: backend, DATABASE_URL, JWT_SECRET, FRONTEND_URL |
| Vercel | busy-beds.vercel.app | Root: frontend, NEXT_PUBLIC_API_URL |
