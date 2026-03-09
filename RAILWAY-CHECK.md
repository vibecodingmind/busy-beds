# Railway Setup Verification Checklist

The **Railway CLI** is optional. It's only used for running one-off commands (seed, admin) from your Mac. Your actual deployment is configured in the **Railway Dashboard**.

## Your current status (last checked)

- **Project:** Busy Beds
- **Service:** busy-beds
- **DATABASE_URL:** Set (internal)
- **JWT_SECRET:** Set
- **FRONTEND_URL:** Set to `busy-beds-production.up.railway.app` – this is the **backend** URL. Update to your **Vercel** URL (e.g. `https://busy-beds.vercel.app`) in Railway Dashboard → Backend → Variables.

---

## 1. Railway Dashboard – Backend Service

Go to [railway.app](https://railway.app) → your **Busy Beds** project.

### Backend service settings

| Setting | Expected | Where to check |
|---------|----------|----------------|
| **Root Directory** | `backend` | Settings → Root Directory |
| **Build Command** | (auto) or `npm install && npm run build` | Settings → Build |
| **Start Command** | (from railway.toml) `npm run migrate && npm start` | Settings → Deploy |
| **Public Domain** | Generated (e.g. `xxx.up.railway.app`) | Settings → Networking |

### Backend service variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Use **Add Reference** → PostgreSQL → `DATABASE_URL` (internal URL) |
| `JWT_SECRET` | Yes | Random string from `openssl rand -base64 32` |
| `FRONTEND_URL` | Yes | Your Vercel URL, e.g. `https://busy-beds.vercel.app` (comma-separated for multiple) |

**Important:** `DATABASE_URL` must be the **internal** reference (`postgres.railway.internal`), not the public URL. Railway injects this when you use "Add Reference".

---

## 2. Railway Dashboard – PostgreSQL Service

| Check | Expected |
|-------|----------|
| Service exists | PostgreSQL is provisioned |
| Variables | Has `DATABASE_URL` (internal and public) |

---

## 3. Verify deployment

1. **Backend health:** Open `https://YOUR-BACKEND-URL/health`  
   - Should return `{"status":"ok"}`

2. **API:** Open `https://YOUR-BACKEND-URL/api/v1/hotels`  
   - Should return `{"hotels":[...]}` (or `[]` if empty)

3. **Logs:** Backend service → **Deployments** → latest → **View Logs**  
   - Look for: `Migration completed` and `Busy Beds API running on port XXXX`

---

## 4. Railway CLI (optional)

The CLI is **not required** for deployment. It's only for running commands with Railway's env vars.

If you use it:

```bash
cd "/Users/guteng/Documents/Busy Beds"
railway link    # Links to your project
railway status  # Shows linked project/service
```

**Common issue:** `railway run` says "DATABASE_URL not set"  
- **Cause:** Backend service has no `DATABASE_URL` variable  
- **Fix:** In Railway Dashboard → Backend → Variables → Add Reference → PostgreSQL → `DATABASE_URL`

---

## 5. Quick fix checklist

If the backend is not working:

- [ ] Root Directory = `backend`
- [ ] `DATABASE_URL` is set (reference from Postgres)
- [ ] `JWT_SECRET` is set
- [ ] `FRONTEND_URL` = your Vercel URL
- [ ] Public domain is generated (Settings → Networking)
- [ ] Latest deployment succeeded (check Deployments tab)
- [ ] Logs show no errors
