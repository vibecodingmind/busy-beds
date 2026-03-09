# Deploy Backend to Render (when Railway is stuck)

Use this when Railway builds are stuck. You can keep your **Railway PostgreSQL** and deploy only the **backend** to Render.

---

## 1. Create Render account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

---

## 2. Create Web Service

1. **Dashboard** → **New +** → **Web Service**
2. Connect your **busy-beds** GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | busy-beds-backend |
| **Region** | Oregon (US West) or nearest |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run migrate && npm start` |

---

## 3. Environment Variables

Add these in **Environment**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your **Railway Postgres PUBLIC** URL (from Railway → PostgreSQL → Connect → Public URL) |
| `JWT_SECRET` | `openssl rand -base64 32` (or reuse your existing one) |
| `FRONTEND_URL` | `https://busy-beds.vercel.app` (your Vercel URL) |

---

## 4. Deploy

Click **Create Web Service**. Render will build and deploy.

---

## 5. Get your Render URL

After deploy, copy the URL (e.g. `https://busy-beds-backend.onrender.com`).

---

## 6. Update Vercel

1. Vercel → Project → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_API_URL` to:
   ```
   https://YOUR-RENDER-URL.onrender.com/api/v1
   ```
3. **Redeploy** the Vercel project

---

## 7. Update Railway (optional)

If you switch to Render, you can leave Railway Postgres as-is (it has your data). No need to change anything on Railway for the database.

---

## Summary

| Before | After |
|--------|-------|
| Backend: Railway | Backend: **Render** |
| Database: Railway Postgres | Database: **Railway Postgres** (unchanged) |
| Frontend: Vercel | Frontend: Vercel (update API URL) |
