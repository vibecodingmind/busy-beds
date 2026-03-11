# Step-by-step: Get reviews on your live site

Follow these steps in order. You need: your Railway backend URL and a secret (SEED_SECRET).

---

## Step 1: Deploy the backend (so the reviews seed endpoint is live)

1. In your project folder, commit and push:
   ```bash
   cd "/Users/guteng/Documents/Busy Beds"
   git add -A
   git status
   git commit -m "Add seed reviews API endpoint"
   git push
   ```
2. Wait for Railway to finish deploying (check your Railway dashboard).
3. Note your **backend URL** (e.g. `https://busy-beds-backend.up.railway.app`). You’ll use it in Step 3.

---

## Step 2: Set SEED_SECRET in Railway (one-time)

1. Go to [railway.app](https://railway.app) and open your **Busy Beds** project.
2. Click your **backend** service (the one that runs the Node/Express API).
3. Open the **Variables** tab.
4. If `SEED_SECRET` is already there, skip to Step 3. If not:
   - Click **+ New variable** or **Add variable**.
   - Name: `SEED_SECRET`
   - Value: any random string (e.g. run in terminal: `openssl rand -hex 16` and paste the result).
   - Save. Railway will redeploy; wait for it to finish.
5. Copy the value of `SEED_SECRET` somewhere safe (you’ll paste it in the URL in Step 3).

---

## Step 3: Call the reviews seed URL (one time)

Use **your** backend URL and **your** SEED_SECRET.

**Option A – Browser**

1. Open this URL in your browser (replace the two placeholders):
   ```
   https://YOUR_BACKEND_URL/api/v1/seed/reviews?secret=YOUR_SEED_SECRET
   ```
   Example:
   ```
   https://busy-beds-backend.up.railway.app/api/v1/seed/reviews?secret=abc123yourSecretHere
   ```
2. You should see a JSON response like:
   ```json
   {"success":true,"message":"Seeded 12 reviews across 3 properties.","inserted":12}
   ```

**Option B – Terminal (curl)**

1. Run (replace with your URL and secret):
   ```bash
   curl "https://YOUR_BACKEND_URL/api/v1/seed/reviews?secret=YOUR_SEED_SECRET"
   ```
2. Same JSON response as above means it worked.

---

## Step 4: Check your site

1. Open your **frontend** (e.g. https://frontend-peach-eight-77.vercel.app).
2. Go to **Browse Properties** (or any page that lists hotels).
3. Each property card should show a star rating and a review count (e.g. `4.2 (4)`).
4. Open a property detail page and scroll to **Reviews** – you should see the seeded reviews.

---

## Troubleshooting

| Problem | What to do |
|--------|-------------|
| **403 Invalid or missing secret** | Check that `SEED_SECRET` in Railway **exactly** matches what you put in the URL (no extra spaces). |
| **404 or connection error** | Use the correct backend URL from Railway (backend service → Settings or Deployments → copy the public URL). |
| **Still “No reviews yet”** | Wait 30 seconds and refresh; if you’re on a cached page, do a hard refresh (e.g. Cmd+Shift+R). |
| **Backend URL unclear** | Railway → your backend service → **Settings** → **Networking** or **Domains** to see the public URL. |

---

## Quick checklist

- [ ] Backend deployed (git push, Railway build finished)
- [ ] `SEED_SECRET` set in Railway Variables
- [ ] Opened `https://YOUR_BACKEND_URL/api/v1/seed/reviews?secret=YOUR_SEED_SECRET` and saw `"success": true`
- [ ] Frontend shows ratings and review counts on property cards

Once all are done, reviews are live.
