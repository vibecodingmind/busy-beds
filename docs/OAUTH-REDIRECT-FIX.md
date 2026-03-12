# OAuth Redirect URI Fix (Google, Facebook, LinkedIn)

If you see **Google**: `Error 400: redirect_uri_mismatch`, **Facebook**: "URL Blocked... redirect URI is not whitelisted", or **LinkedIn** redirect errors, the callback URL must match what’s configured in the provider. The app uses **frontend** callback URLs (busybeds.com), not the API.

---

## 1. Callback URLs (frontend)

Add these **exactly** in each provider (no trailing slash, HTTPS in production):

| Provider   | Callback URL (whitelist this)        |
|-----------|---------------------------------------|
| **Google**   | `https://busybeds.com/auth/google/callback`   |
| **Facebook** | `https://busybeds.com/auth/facebook/callback` |
| **LinkedIn** | `https://busybeds.com/auth/linkedin/callback` |

The backend uses `FRONTEND_URL` to build these (e.g. `https://busybeds.com`). Ensure **Railway** has `FRONTEND_URL` = `https://busybeds.com` (no trailing slash).

---

## 2. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs** add:
   ```text
   https://busybeds.com/auth/google/callback
   ```
4. Save.

---

## 3. Facebook / Meta for Developers

1. [Meta for Developers](https://developers.facebook.com/) → your app → **Facebook Login** → **Settings** (or **Use cases** → **Customize** → **Settings**).
2. Under **Valid OAuth Redirect URIs** add:
   ```text
   https://busybeds.com/auth/facebook/callback
   ```
3. Under **App Domains** add: `busybeds.com` (and `api.busybeds.com` if you use it).
4. Set **Client OAuth Login** and **Web OAuth Login** to **Yes**.
5. Under **Facebook Login** → **Settings**, ensure the app requests at least one permission. The app uses **public_profile** and **email**; if you see “This app needs at least one supported permission”, add **public_profile** and **email** under **App Review** → **Permissions and Features** (or in your Login product settings) and ensure they’re enabled for your app.
6. Save.

---

## 4. LinkedIn (Developer Portal)

1. [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → your app → **Auth** tab.
2. Under **Authorized redirect URLs** add:
   ```text
   https://busybeds.com/auth/linkedin/callback
   ```
3. Under **Products**, request **Sign In with LinkedIn using OpenID Connect** (needed for email/profile).
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Railway (or Admin → Settings → OAuth).

---

## 5. Quick checklist

- [ ] **Railway**: `FRONTEND_URL` = `https://busybeds.com` (no trailing slash).
- [ ] **Google**: Authorized redirect URI = `https://busybeds.com/auth/google/callback`.
- [ ] **Facebook**: Valid OAuth Redirect URI = `https://busybeds.com/auth/facebook/callback`; App Domains and Web/Client OAuth Login enabled.
- [ ] **LinkedIn**: Authorized redirect URL = `https://busybeds.com/auth/linkedin/callback`; OpenID Connect product added.

The redirect URI must match **character-for-character** (including `https`, no trailing slash).
