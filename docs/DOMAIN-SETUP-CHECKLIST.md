# busybeds.com Setup Checklist

Use this to verify domain, hosting, and email are set correctly.

---

## 1. ResellerClub DNS (busybeds.com)

In **ResellerClub** → Domains → busybeds.com → **DNS Management**, confirm you have:

| Type   | Host/Name | Value |
|--------|-----------|--------|
| **A**  | `@`       | `76.76.21.21` (Vercel) |
| **CNAME** | `www`  | `cname.vercel-dns.com` |
| **CNAME** | `api`  | Your Railway hostname (e.g. `your-app.up.railway.app`) |
| **MX**  | As shown in Resend | Resend’s MX value (for email) |
| **TXT** | As shown in Resend | Resend’s verification/DKIM value |

- Replace the Railway hostname with the one from your Railway project.
- MX and TXT must match exactly what Resend shows for busybeds.com.

---

## 2. Vercel (frontend)

- **Domains**: Project → Settings → Domains  
  - `busybeds.com`  
  - `www.busybeds.com`  
  - Both should show as verified/active once DNS has propagated.

- **Environment variables** (Project → Settings → Environment Variables), for **Production** (and Preview if you use it):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.busybeds.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://busybeds.com` (optional; used for sitemap) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps key (if you use maps) |

- Redeploy after changing env vars so the frontend uses the new API URL and domain.

---

## 3. Railway (backend)

- **Custom domain**: Service → Settings → Networking/Domains  
  - Add `api.busybeds.com` and ensure it’s active (Railway will show the CNAME target for ResellerClub).

- **Environment variables** (Service → Variables):

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://busybeds.com` |
| `API_URL` | `https://api.busybeds.com` (needed for Google/Facebook OAuth callbacks) |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret |
| `RESEND_API_KEY` | From Resend dashboard |
| `EMAIL_FROM` | `Busy Beds <hello@busybeds.com>` |
| Stripe/PayPal/other | As needed |

- CORS: Backend allows origins from `FRONTEND_URL`. With `FRONTEND_URL=https://busybeds.com`, requests from https://busybeds.com are allowed.

---

## 4. Resend (email hello@busybeds.com)

- **Domains**: Add **busybeds.com**, then add the MX and TXT records in ResellerClub exactly as Resend shows.
- **Verify**: In Resend, run “Verify” for busybeds.com; it should show as verified.
- **From address**: Use `hello@busybeds.com` (or any address @busybeds.com) in `EMAIL_FROM` on Railway.

---

## 5. Quick tests

- **Site**: Open https://busybeds.com and https://www.busybeds.com — both should load your app.
- **API**: Open https://api.busybeds.com/health (or your health endpoint) — should return OK.
- **Login**: Log in from https://busybeds.com — requests should go to api.busybeds.com (check browser Network tab).
- **Email**: Trigger a welcome or password-reset email and confirm it’s from hello@busybeds.com and that Resend shows a successful send.

---

## 6. Optional: OAuth (Google / Facebook)

If you use “Login with Google” or “Login with Facebook”, in their developer consoles set:

- **Authorized redirect URIs**:  
  `https://api.busybeds.com/auth/google/callback`  
  `https://api.busybeds.com/auth/facebook/callback`

`API_URL` on Railway must be `https://api.busybeds.com` so these callbacks work.
