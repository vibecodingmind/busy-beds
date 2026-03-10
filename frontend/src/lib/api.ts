const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getToken(type: 'user' | 'hotel' = 'user'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(type === 'user' ? 'token' : 'hotelToken');
}

export async function api<T>(
  path: string,
  options: RequestInit & { tokenType?: 'user' | 'hotel' } = {}
): Promise<T> {
  const { tokenType = 'user', ...fetchOptions } = options;
  const token = getToken(tokenType);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

// Auth
export const auth = {
  register: (email: string, password: string, name: string) =>
    api<{ user: { id: number; email: string; name: string; role: string }; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    ),
  login: (email: string, password: string) =>
    api<{ user: { id: number; email: string; name: string; role: string }; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () => api<{ id: number; email: string; name: string; role: string }>('/auth/me'),
  forgotPassword: (email: string) =>
    api<{ message: string; resetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    api<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  resendVerification: (email: string) =>
    api<{ message: string; verifyUrl?: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyEmail: (token: string) =>
    api<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

// Hotel auth
export const hotelAuth = {
  register: (hotelId: number, email: string, password: string, name: string) =>
    api<{ hotelAccount: object; hotel: object; token: string }>('/auth/hotel/register', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: hotelId, email, password, name }),
    }),
  login: (email: string, password: string) =>
    api<{ hotelAccount: object; hotel: object; token: string }>('/auth/hotel/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      tokenType: 'hotel',
    }),
  me: () =>
    api<{ hotelAccount: object; hotel: object }>('/auth/hotel/me', { tokenType: 'hotel' }),
  hotelsWithoutAccount: () =>
    api<{ hotels: { id: number; name: string }[] }>('/auth/hotel/hotels-without-account'),
};

// Hotels
export const hotels = {
  list: (limit?: number, offset?: number) =>
    api<{ hotels: Hotel[] }>(`/hotels?limit=${limit || 50}&offset=${offset || 0}`),
  get: (id: number) => api<Hotel>(`/hotels/${id}`),
};

// Coupons
export const coupons = {
  generate: (hotelId: number) =>
    api<Coupon>('/coupons/generate', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: hotelId }),
    }),
  list: () => api<{ coupons: CouponWithHotel[] }>('/coupons'),
  validate: (code: string) =>
    api<{ code: string; user_name: string; hotel_name: string; hotel_id: number; discount_value: string; status: string; expires_at: string }>(
      `/coupons/${encodeURIComponent(code)}/validate`
    ),
  redeem: (code: string) =>
    api<{ success: boolean }>(`/coupons/${encodeURIComponent(code)}/redeem`, {
      method: 'POST',
      tokenType: 'hotel',
    }),
};

// Subscriptions
export const subscriptions = {
  plans: () => api<{ plans: SubscriptionPlan[] }>('/subscriptions/plans'),
  me: () =>
    api<{
      subscription: {
        id: number;
        status: string;
        current_period_start: string;
        current_period_end: string;
        plan: SubscriptionPlan;
      } | null;
    }>('/subscriptions/me'),
  subscribe: (planId: number) =>
    api<{ subscription: object }>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    }),
};

// Hotel dashboard
export const hotelDashboard = {
  redemptions: (start?: string, end?: string) =>
    api<{ redemptions: Redemption[] }>(
      `/hotel/redemptions${start && end ? `?start=${start}&end=${end}` : ''}`,
      { tokenType: 'hotel' }
    ),
  stats: () =>
    api<{ today: number; this_week: number; this_month: number }>('/hotel/stats', {
      tokenType: 'hotel',
    }),
};

// Admin
export const admin = {
  hotels: {
    list: () => api<{ hotels: Hotel[] }>('/admin/hotels'),
    get: (id: number) => api<Hotel>(`/admin/hotels/${id}`),
    create: (data: Partial<Hotel>) =>
      api<Hotel>('/admin/hotels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Hotel>) =>
      api<Hotel>(`/admin/hotels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      api<{ success: boolean }>(`/admin/hotels/${id}`, { method: 'DELETE' }),
    createAccount: (hotelId: number, email: string, password: string, name: string) =>
      api<object>(`/admin/hotels/${hotelId}/account`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
  },
  users: () => api<{ users: User[] }>('/admin/users'),
  coupons: () => api<{ coupons: CouponAdmin[] }>('/admin/coupons'),
  redemptions: () => api<{ redemptions: RedemptionAdmin[] }>('/admin/redemptions'),
  pendingHotelAccounts: () =>
    api<{ accounts: { id: number; hotel_id: number; email: string; name: string; hotel_name: string; created_at: string }[] }>(
      '/admin/hotel-accounts/pending'
    ),
  approveHotelAccount: (id: number) =>
    api<{ success: boolean }>(`/admin/hotel-accounts/${id}/approve`, { method: 'POST' }),
};

// Types
export interface Hotel {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  images: string[];
  latitude?: number | null;
  longitude?: number | null;
  coupon_discount_value: string;
  coupon_limit: number;
  limit_period: string;
}

export interface Coupon {
  id: number;
  code: string;
  user_id: number;
  hotel_id: number;
  discount_value: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface CouponWithHotel extends Coupon {
  hotel_name: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_coupon_limit: number;
  price: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Redemption {
  id: number;
  redeemed_at: string;
  code: string;
  discount_value: string;
  user_name: string;
}

export interface CouponAdmin extends Coupon {
  user_name: string;
  hotel_name: string;
}

export interface RedemptionAdmin extends Redemption {
  hotel_name: string;
}
