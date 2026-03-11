import { pool } from '../config/db';

const ENV_MAP: Record<string, string> = {
  stripe_secret_key: 'STRIPE_SECRET_KEY',
  stripe_webhook_secret: 'STRIPE_WEBHOOK_SECRET',
  paypal_client_id: 'PAYPAL_CLIENT_ID',
  paypal_client_secret: 'PAYPAL_CLIENT_SECRET',
  paypal_sandbox: 'PAYPAL_SANDBOX',
  google_maps_api_key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  google_client_id: 'GOOGLE_CLIENT_ID',
  google_client_secret: 'GOOGLE_CLIENT_SECRET',
  facebook_app_id: 'FACEBOOK_APP_ID',
  facebook_app_secret: 'FACEBOOK_APP_SECRET',
  resend_api_key: 'RESEND_API_KEY',
  email_from: 'EMAIL_FROM',
  site_name: 'SITE_NAME',
  support_email: 'SUPPORT_EMAIL',
  terms_url: 'TERMS_URL',
  privacy_url: 'PRIVACY_URL',
  frontend_url: 'FRONTEND_URL',
  api_url: 'API_URL',
  referral_percent: 'REFERRAL_PERCENT',
  cron_secret: 'CRON_SECRET',
};

export const SETTINGS_META: Record<
  string,
  { label: string; isSecret: boolean; isPublic: boolean; group: string }
> = {
  stripe_secret_key: { label: 'Stripe Secret Key', isSecret: true, isPublic: false, group: 'Stripe' },
  stripe_webhook_secret: { label: 'Stripe Webhook Secret', isSecret: true, isPublic: false, group: 'Stripe' },
  paypal_client_id: { label: 'PayPal Client ID', isSecret: false, isPublic: false, group: 'PayPal' },
  paypal_client_secret: { label: 'PayPal Client Secret', isSecret: true, isPublic: false, group: 'PayPal' },
  paypal_sandbox: { label: 'PayPal Sandbox (true/false)', isSecret: false, isPublic: false, group: 'PayPal' },
  google_maps_api_key: { label: 'Google Maps API Key', isSecret: false, isPublic: true, group: 'Maps' },
  google_client_id: { label: 'Google OAuth Client ID', isSecret: false, isPublic: false, group: 'OAuth' },
  google_client_secret: { label: 'Google OAuth Client Secret', isSecret: true, isPublic: false, group: 'OAuth' },
  facebook_app_id: { label: 'Facebook App ID', isSecret: false, isPublic: false, group: 'OAuth' },
  facebook_app_secret: { label: 'Facebook App Secret', isSecret: true, isPublic: false, group: 'OAuth' },
  resend_api_key: { label: 'Resend API Key (email)', isSecret: true, isPublic: false, group: 'Email' },
  email_from: { label: 'Email From address', isSecret: false, isPublic: false, group: 'Email' },
  site_name: { label: 'Site name', isSecret: false, isPublic: true, group: 'Site' },
  support_email: { label: 'Support / contact email', isSecret: false, isPublic: true, group: 'Site' },
  terms_url: { label: 'Terms of service URL', isSecret: false, isPublic: true, group: 'Site' },
  privacy_url: { label: 'Privacy policy URL', isSecret: false, isPublic: true, group: 'Site' },
  frontend_url: { label: 'Frontend URL (redirects, emails)', isSecret: false, isPublic: false, group: 'URLs' },
  api_url: { label: 'API URL (OAuth callbacks)', isSecret: false, isPublic: false, group: 'URLs' },
  referral_percent: { label: 'Referral reward percent (e.g. 25)', isSecret: false, isPublic: false, group: 'Business' },
  cron_secret: { label: 'Cron / seed secret', isSecret: true, isPublic: false, group: 'Security' },
};

const PUBLIC_KEYS = Object.entries(SETTINGS_META)
  .filter(([, m]) => m.isPublic)
  .map(([k]) => k);

let cache: Record<string, string | null> = {};
let cacheTs = 0;
const CACHE_TTL_MS = 60_000;

function maskSecret(value: string | null): string {
  if (!value || value.length < 8) return value ? '••••••••' : '';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

export async function getSetting(key: string): Promise<string | null> {
  const envVar = ENV_MAP[key];
  const envVal = envVar ? process.env[envVar] : undefined;
  if (envVal != null && envVal !== '') return envVal;

  if (Date.now() - cacheTs < CACHE_TTL_MS && key in cache) return cache[key];

  const row = await pool.query<{ value: string | null }>('SELECT value FROM settings WHERE key = $1', [key]);
  const val = row.rows[0]?.value ?? null;
  cache[key] = val;
  return val;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
  cache[key] = value;
}

export function invalidateCache(): void {
  cache = {};
  cacheTs = 0;
}

export async function getAllForAdmin(): Promise<
  { key: string; label: string; value: string; masked: boolean; group: string }[]
> {
  const keys = Object.keys(SETTINGS_META);
  const result: { key: string; label: string; value: string; masked: boolean; group: string }[] = [];
  for (const key of keys) {
    const meta = SETTINGS_META[key]!;
    const raw = await getSetting(key);
    const value = meta.isSecret ? maskSecret(raw ?? '') : (raw ?? '');
    result.push({ key, label: meta.label, value, masked: meta.isSecret, group: meta.group });
  }
  return result;
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const key of PUBLIC_KEYS) {
    const v = await getSetting(key);
    if (v) out[key] = v;
  }
  return out;
}

export async function updateSettings(updates: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    if (!SETTINGS_META[key]) continue;
    if (value === '' || value == null) {
      await pool.query('DELETE FROM settings WHERE key = $1', [key]);
      cache[key] = null;
    } else {
      await setSetting(key, value);
    }
  }
  invalidateCache();
}
