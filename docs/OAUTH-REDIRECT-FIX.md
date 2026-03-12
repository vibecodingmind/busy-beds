# OAuth Redirect URI Fix (Google & Facebook)

If you see **Google**: `Error 400: redirect_uri_mismatch` or **Facebook**: "URL Blocked... redirect URI is not whitelisted", the app is sending a callback URL that doesn’t match what’s configured in the provider. Fix it as below.

---

## 1. Know your exact callback URLs

The backend builds callbacks from **API_URL** (no trailing slash). For production with `API_URL=https://api.busybeds.com`:

| Provider | Callback URL (add this exactly) |
|----------|----------------------------------|
| **Google**  | `https://api.busybeds.com/auth/google/callback` |
| **Facebook**| `https://api.busybeds.com/auth/facebook/callback` |

- No trailing slash.
- Must be **HTTPS** in production.
- If your API is on a different host (e.g. `https://your-app.railway.app`), use that host instead of `api.busybeds.com` in the table above.

---

## 2. Set API_URL on the backend (Railway)

In **Railway** → your backend service → **Variables**:

- Add or set: `API_URL` = `https://api.busybeds.com` (or your real API base URL).
- **Do not** add a trailing slash: use `https://api.busybeds.com`, not `https://api.busybeds.com/`.

Redeploy the backend after changing variables so the OAuth routes use the correct base.

---

## 3. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, add **exactly**:
   ```text
   https://api.busybeds.com/auth/google/callback
   ```
4. If you use another API domain (e.g. Railway), add that too, e.g.:
   ```text
   https://your-app.railway.app/auth/google/callback
   ```
5. Save. Changes can take a few minutes to apply.

---

## 4. Facebook / Meta for Developers

1. Open [Meta for Developers](https://developers.facebook.com/) → your app → **Facebook Login** → **Settings** (or **Use cases** → **Customize** → **Settings**).
2. Under **Valid OAuth Redirect URIs** add **exactly**:
   ```text
   https://api.busybeds.com/auth/facebook/callback
   ```
3. Under **App Domains** add your frontend and API domains, e.g.:
   - `busybeds.com`
   - `api.busybeds.com`
4. Ensure **Client OAuth Login** and **Web OAuth Login** are **Yes**.
5. Save changes.

---

## 5. Quick checklist

- [ ] **Railway**: `API_URL` set to your API base URL with **no trailing slash**; backend redeployed.
- [ ] **Google**: Authorized redirect URI = `https://api.busybeds.com/auth/google/callback` (or your API host).
- [ ] **Facebook**: Valid OAuth Redirect URI = `https://api.busybeds.com/auth/facebook/callback`; App Domains and Web/Client OAuth Login enabled.

The URL the backend sends must match the provider **character-for-character** (including `https` and no trailing slash).
