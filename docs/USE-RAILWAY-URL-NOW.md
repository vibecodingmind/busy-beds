# Get the app working now (use Railway’s default API URL)

Use this when **api.busybeds.com** doesn’t work or you don’t want to fix DNS yet. The site stays on **busybeds.com**; only API calls use Railway’s URL. Users still use busybeds.com.

---

## Step 1: Get your backend URL from Railway

1. Go to [railway.app](https://railway.app) and open your project.
2. Click your **backend** service (the one that runs the Node/Express API).
3. Open **Settings** → **Networking** (or **Domains**).
4. Under **Public Networking**, find the public URL, e.g.:
   - `https://busybeds-production.up.railway.app`
   - or `https://busy-beds-backend-xxxx.up.railway.app`
5. If you don’t see a public URL, click **Generate Domain** and copy the new URL.
6. Your API base URL is: **that URL + `/api/v1`**  
   Example: `https://busybeds-production.up.railway.app/api/v1`

---

## Step 2: Set it on Vercel

1. Go to [vercel.com](https://vercel.com) → your **Busy Beds** project.
2. **Settings** → **Environment Variables**.
3. Add or edit:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** the URL from Step 1 (e.g. `https://busybeds-production.up.railway.app/api/v1`)
   - **Environments:** Production (and Preview if you use it).
4. Save.

---

## Step 3: Redeploy the frontend

1. In the same Vercel project, go to **Deployments**.
2. Open the **⋮** menu on the latest deployment → **Redeploy**.
3. Wait for the build to finish.

---

## Step 4: Set FRONTEND_URL on Railway (for redirects and CORS)

1. Back in **Railway** → your **backend** service → **Variables**.
2. Add or set:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://busybeds.com`
3. Railway will redeploy the backend automatically.

---

## Step 5: Test

1. Open **https://busybeds.com**
2. Try **Login** with your admin email and password.
3. If it works, go to **https://busybeds.com/admin**.

---

## Later (optional): Use api.busybeds.com again

When you want to use **api.busybeds.com** for the API:

1. In **Railway** → backend → **Networking**, add custom domain **api.busybeds.com** and note the CNAME target.
2. In **ResellerClub** (or your DNS), add a **CNAME**: host **api** → that target.
3. After DNS propagates and Railway shows the domain as active, in **Vercel** set `NEXT_PUBLIC_API_URL` to `https://api.busybeds.com/api/v1` and **redeploy** the frontend.

Until then, the app works with the Railway default URL.
