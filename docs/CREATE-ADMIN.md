# Create admin user (no local DB)

Use this when you can’t run `seed-admin.ts` from your Mac. The backend on Railway creates the admin.

## Easiest: use the bootstrap page (browser)

1. **Vercel** must point to your API: set `NEXT_PUBLIC_API_URL` to your **Railway backend URL** + `/api/v1` (e.g. `https://xxxx.up.railway.app/api/v1`) and redeploy. See [USE-RAILWAY-URL-NOW.md](USE-RAILWAY-URL-NOW.md) if the custom domain doesn’t work.
2. **Railway** → backend **Variables** → set `SEED_SECRET` (e.g. `busybeds-seed-2024`).
3. Open in the browser (use your real site URL and secret):
   **https://busybeds.com/bootstrap-admin?secret=busybeds-seed-2024**
4. Enter admin email and password, click **Create admin**.
5. Log in at **https://busybeds.com/login**, then go to **https://busybeds.com/admin**.

---

## Alternative: curl or fetch

## 1. Set SEED_SECRET in Railway

- Railway → your **backend** service → **Variables**.
- Add: `SEED_SECRET` = any random string (e.g. run `openssl rand -hex 16` and paste).
- Redeploy if needed.

## 2. Call the API once

Replace `YOUR_SEED_SECRET` with the value you set. Use your real API URL (e.g. `https://api.busybeds.com`).

```bash
curl -X POST "https://api.busybeds.com/api/v1/seed/admin?secret=YOUR_SEED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"vibecodingmind@gmail.com","password":"G@t@ng@T@E511713"}'
```

You should see: `{"success":true,"message":"Admin user vibecodingmind@gmail.com created/updated. You can log in now."}`

## 3. Log in

- Go to **https://busybeds.com/login**
- Email: **vibecodingmind@gmail.com**
- Password: **G@t@ng@T@E511713**
- Then open **https://busybeds.com/admin**

After that you can change your password in Account settings. Remove or rotate `SEED_SECRET` if you want to lock down the endpoint.
