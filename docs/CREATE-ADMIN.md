# Create admin user (no local DB)

Use this when you can’t run `seed-admin.ts` from your Mac (e.g. DB connection times out). The backend runs on Railway and can reach the DB; you just call an API once.

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
