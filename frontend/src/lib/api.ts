const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function getPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/settings/public`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

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
    if (res.status === 429) {
      const retryAfter = data.retryAfter || res.headers.get('Retry-After') || '15 minutes';
      throw new Error(`You've tried too often. Please try again in ${retryAfter}.`);
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

// Auth
export const auth = {
  register: (email: string, password: string, name: string, referralCode?: string) =>
    api<{ user: { id: number; email: string; name: string; role: string }; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name, referral_code: referralCode }) }
    ),
  login: (email: string, password: string) =>
    api<{ user: { id: number; email: string; name: string; role: string }; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () =>
    api<{
      id: number;
      email: string;
      name: string;
      role: string;
      avatar_url?: string | null;
      phone?: string | null;
      email_verified?: boolean;
      whatsapp_opt_in?: boolean;
    }>('/auth/me'),
  meStats: () =>
    api<{ redemptions_this_month: number }>('/auth/me/stats'),
  updateProfile: (data: { name?: string; email?: string; phone?: string | null; avatar_url?: string | null; whatsapp_opt_in?: boolean }) =>
    api<{
      id: number;
      email: string;
      name: string;
      role: string;
      avatar_url?: string | null;
      phone?: string | null;
      email_verified?: boolean;
      whatsapp_opt_in?: boolean;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
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
  list: (opts?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: string;
    featured?: boolean;
    min_rating?: number;
    lat?: number;
    lng?: number;
  }) => {
    const params = new URLSearchParams();
    params.set('limit', String(opts?.limit || 50));
    params.set('offset', String(opts?.offset || 0));
    if (opts?.search) params.set('search', opts.search);
    if (opts?.sort) params.set('sort', opts.sort || 'name');
    if (opts?.featured !== undefined) params.set('featured', String(opts.featured));
    if (opts?.min_rating != null) params.set('min_rating', String(opts.min_rating));
    if (opts?.lat != null) params.set('lat', String(opts.lat));
    if (opts?.lng != null) params.set('lng', String(opts.lng));
    return api<{ hotels: Hotel[] }>(`/hotels?${params}`);
  },
  get: (id: number) => api<Hotel>(`/hotels/${id}`),
};

// Favorites
export const favorites = {
  add: (hotelId: number) =>
    api<{ favorited: boolean }>(`/favorites/${hotelId}`, { method: 'POST' }),
  remove: (hotelId: number) =>
    api<{ favorited: boolean }>(`/favorites/${hotelId}`, { method: 'DELETE' }),
  ids: () => api<{ hotelIds: number[] }>('/favorites/ids'),
  hotels: () => api<{ hotels: Hotel[] }>('/favorites/hotels'),
  check: (hotelId: number) => api<{ favorited: boolean }>(`/favorites/check/${hotelId}`),
};

// Coupons
export const coupons = {
  generate: (hotelId: number) =>
    api<Coupon>('/coupons/generate', {
      method: 'POST',
      body: JSON.stringify({ hotel_id: hotelId }),
    }),
  list: () => api<{ coupons: CouponWithHotel[] }>('/coupons'),
  setReminder: (couponId: number, remind1Day: boolean) =>
    api<{ remind_1_day_before: boolean }>('/coupons/set-reminder', {
      method: 'POST',
      body: JSON.stringify({ coupon_id: couponId, remind_1_day_before: remind1Day }),
    }),
  cancel: (couponId: number) =>
    api<{ success: boolean }>('/coupons/cancel', {
      method: 'POST',
      body: JSON.stringify({ coupon_id: couponId }),
    }),
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
  cancel: () =>
    api<{ success: boolean }>('/subscriptions/cancel', { method: 'POST' }),
};

export const stripe = {
  createCheckoutSession: (planId: number, successUrl?: string, cancelUrl?: string, promoCode?: string) =>
    api<{ url: string; sessionId: string }>('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, success_url: successUrl, cancel_url: cancelUrl, promo_code: promoCode }),
    }),
  billingPortal: () =>
    api<{ url: string }>('/stripe/billing-portal', { method: 'POST' }),
};

export const paypal = {
  createSubscription: (planId: number, successUrl?: string, cancelUrl?: string) =>
    api<{ url: string; subscriptionId: string }>('/paypal/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, success_url: successUrl, cancel_url: cancelUrl }),
    }),
};

export const flutterwave = {
  createCharge: (planId: number, successUrl?: string, cancelUrl?: string) =>
    api<{ url: string; tx_ref: string }>('/flutterwave/create-charge', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, success_url: successUrl, cancel_url: cancelUrl }),
    }),
};

export const flutterwave = {
  createCharge: (planId: number, successUrl?: string, cancelUrl?: string) =>
    api<{ url: string; tx_ref: string }>('/flutterwave/create-charge', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, success_url: successUrl, cancel_url: cancelUrl }),
    }),
};

// Reviews
export const reviews = {
  recent: (limit?: number) =>
    api<{ reviews: { id: number; rating: number; comment: string | null; user_name: string; hotel_name: string; created_at: string }[] }>(
      `/reviews/recent${limit != null ? `?limit=${limit}` : ''}`
    ),
  stats: () => api<{ totalReviews: number }>('/reviews/stats'),
  list: (hotelId: number, sort?: 'recent' | 'rating_high' | 'rating_low' | 'verified_first') =>
    api<{
      reviews: {
        id: number;
        rating: number;
        comment: string | null;
        user_name: string;
        created_at: string;
        verified_guest?: boolean;
        hotel_response?: { response_text: string; created_at: string };
        helpful_count?: number;
        not_helpful_count?: number;
        user_vote?: boolean | null;
      }[];
      averageRating: number | null;
      totalCount: number;
    }>(`/reviews/hotels/${hotelId}${sort ? `?sort=${sort}` : ''}`),
  voteHelpful: (reviewId: number, helpful: boolean) =>
    api<{ success: boolean }>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    }),
  addResponse: (reviewId: number, responseText: string) =>
    api<{ success: boolean }>(`/reviews/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ response_text: responseText }),
      tokenType: 'hotel',
    }),
  myReview: (hotelId: number) =>
    api<{ review: { id: number; rating: number; comment: string | null } | null }>(`/reviews/hotels/${hotelId}/me`),
  create: (hotelId: number, rating: number, comment?: string) =>
    api<{ id: number; rating: number; comment: string | null }>(`/reviews/hotels/${hotelId}`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};

// Public pages (privacy, terms, about, contact details)
export const pages = {
  getContent: (slug: 'privacy' | 'terms' | 'about') =>
    fetch(`${API_BASE}/pages/${slug}`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to fetch page');
      const data = await res.json();
      return data.content as string;
    }),
  getContactDetails: () =>
    fetch(`${API_BASE}/pages/contact`).then(async (res) => {
      if (!res.ok) throw new Error('Failed to fetch contact details');
      return res.json() as Promise<{ contactEmail: string | null; contactPhone: string | null; contactAddress: string | null }>;
    }),
};

// Contact form (no auth)
export const contact = {
  submit: (data: { name: string; email: string; message: string }) =>
    fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      return data as { success: boolean; message: string };
    }),
};

// Waitlist
export const waitlist = {
  join: (email: string) =>
    api<{ success: boolean; message: string }>('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// Promo codes
export const promo = {
  validate: (code: string) =>
    api<{ valid: boolean; discount_type?: string; discount_value?: number; message?: string }>(
      `/promo/validate?code=${encodeURIComponent(code)}`
    ),
};

// Referrals
export type ReferralReward = { referred_id: number; referred_name: string; amount: number; status: string; created_at: string };
export type ReferralMeResponse = {
  code: string;
  referred: { id: number; name: string; email: string; created_at: string }[];
  rewards: ReferralReward[];
  total_earned: number;
  total_pending: number;
  withdrawable_balance: number;
  withdraw_min_amount: number;
  withdraw_max_amount: number;
  earnings_this_month?: number;
};
export type WithdrawRequestRow = {
  id: number;
  amount: number;
  method: string;
  method_details: string;
  status: string;
  created_at: string;
  processed_at: string | null;
};
export const referrals = {
  me: () => api<ReferralMeResponse>('/referrals/me'),
  withdrawRequest: (amount: number, method: string, method_details: string) =>
    api<{ success: boolean; message: string }>('/referrals/withdraw-request', {
      method: 'POST',
      body: JSON.stringify({ amount, method, method_details }),
    }),
  withdrawRequests: () =>
    api<{ requests: WithdrawRequestRow[] }>('/referrals/withdraw-requests'),
};

// Hotel dashboard
export const hotelDashboard = {
  redemptions: (start?: string, end?: string) =>
    api<{ redemptions: Redemption[] }>(
      `/hotel/redemptions${start && end ? `?start=${start}&end=${end}` : ''}`,
      { tokenType: 'hotel' }
    ),
  bulkRedeem: (codes: string[]) =>
    api<{ results: { code: string; success: boolean; error?: string }[] }>('/hotel/redemptions/bulk', {
      method: 'POST',
      body: JSON.stringify({ codes }),
      tokenType: 'hotel',
    }),
  stats: () =>
    api<{ today: number; this_week: number; this_month: number }>('/hotel/stats', {
      tokenType: 'hotel',
    }),
  chart: (days?: number) =>
    api<{ data: { date: string; count: number }[] }>(
      `/hotel/chart${days ? `?days=${days}` : ''}`,
      { tokenType: 'hotel' }
    ),
};

// Admin (hotels include managing_account)
export interface ManagingAccount {
  id: number;
  email: string;
  name: string;
  approved: boolean;
}

export type AdminHotel = Hotel & { managing_account: ManagingAccount | null };

export const admin = {
  hotels: {
    list: () => api<{ hotels: AdminHotel[] }>('/admin/hotels'),
    get: (id: number) => api<AdminHotel>(`/admin/hotels/${id}`),
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
  users: () =>
    api<{ users: (User & { active?: boolean; created_at?: string })[] }>('/admin/users'),
  userDelete: (id: number) =>
    api<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
  userUpdateActive: (id: number, active: boolean) =>
    api<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  coupons: () => api<{ coupons: CouponAdmin[] }>('/admin/coupons'),
  redemptions: () => api<{ redemptions: RedemptionAdmin[] }>('/admin/redemptions'),
  pendingHotelAccounts: () =>
    api<{ accounts: { id: number; hotel_id: number; email: string; name: string; hotel_name: string; created_at: string }[] }>(
      '/admin/hotel-accounts/pending'
    ),
  approveHotelAccount: (id: number) =>
    api<{ success: boolean }>(`/admin/hotel-accounts/${id}/approve`, { method: 'POST' }),
  analytics: () =>
    api<{
      total_users: number;
      total_hotels: number;
      active_subscriptions: number;
      active_coupons: number;
      total_redemptions: number;
    }>('/admin/analytics'),
  analyticsChart: () =>
    api<{ signups: { date: string; count: number }[]; redemptions: { date: string; count: number }[] }>('/admin/analytics/chart'),
  auditLog: (limit?: number) =>
    api<{ entries: { id: number; admin_user_id: number; action: string; entity_type: string | null; entity_id: string | null; details: string | null; created_at: string; admin_email: string | null }[] }>(
      `/admin/audit-log${limit != null ? `?limit=${limit}` : ''}`
    ),
  plans: {
    list: () =>
      api<{
        plans: {
          id: number;
          name: string;
          monthly_coupon_limit: number;
          price: number;
          currency?: string;
          stripe_price_id: string | null;
          paypal_plan_id: string | null;
          flutterwave_plan_id: string | null;
        }[];
      }>('/admin/plans'),
    create: (data: {
      name: string;
      monthly_coupon_limit: number;
      price: number;
      currency?: string;
      stripe_price_id?: string;
      paypal_plan_id?: string;
      flutterwave_plan_id?: string;
    }) => api<object>('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: number,
      data: Partial<{
        name: string;
        monthly_coupon_limit: number;
        price: number;
        currency: string;
        stripe_price_id: string;
        paypal_plan_id: string;
        flutterwave_plan_id: string;
      }>
    ) => api<object>(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => api<{ success: boolean }>(`/admin/plans/${id}`, { method: 'DELETE' }),
  },
  settings: {
    list: () =>
      api<{
        settings: { key: string; label: string; value: string; masked: boolean; group: string }[];
      }>('/admin/settings'),
    update: (updates: Record<string, string>) =>
      api<{ success: boolean }>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },
  pages: {
    get: () =>
      api<{
        page_privacy: string;
        page_terms: string;
        page_about: string;
        contact_phone: string;
        contact_address: string;
      }>('/admin/pages'),
    update: (updates: {
      page_privacy?: string;
      page_terms?: string;
      page_about?: string;
      contact_phone?: string;
      contact_address?: string;
    }) =>
      api<{ success: boolean }>('/admin/pages', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },
  contactSubmissions: {
    list: () =>
      api<{
        submissions: { id: number; name: string; email: string; message: string; status: string; admin_notes: string | null; created_at: string }[];
      }>('/admin/contact-submissions'),
    update: (id: number, data: { status?: string; admin_notes?: string }) =>
      api<{ id: number; name: string; email: string; message: string; status: string; admin_notes: string | null; created_at: string }>(
        `/admin/contact-submissions/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) }
      ),
  },
  withdrawRequests: {
    list: (status?: string) =>
      api<{
        requests: {
          id: number;
          user_id: number;
          user_email: string;
          user_name: string;
          amount: number;
          method: string;
          method_details: string;
          status: string;
          admin_notes: string | null;
          created_at: string;
          processed_at: string | null;
        }[];
        pending_count: number;
      }>(`/admin/withdraw-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    update: (id: number, data: { status: string; admin_notes?: string }) =>
      api<{ success: boolean }>(`/admin/withdraw-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  exportCsv: async (path: string, filename: string): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// Types
export interface Hotel {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp?: string | null;
  images: string[];
  latitude?: number | null;
  longitude?: number | null;
  booking_url?: string | null;
  featured?: boolean;
  active?: boolean;
  avg_rating?: number | null;
  review_count?: number;
  redemptions_this_month?: number;
  avg_response_hours?: number | null;
  created_at?: string;
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
  remind_1_day_before?: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_coupon_limit: number;
  price: number;
  currency?: string;
  stripe_price_id?: string | null;
  paypal_plan_id?: string | null;
  flutterwave_plan_id?: string | null;
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
