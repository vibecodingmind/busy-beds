'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  phone?: string | null;
  email_verified?: boolean;
  whatsapp_opt_in?: boolean;
  notif_coupon_expiry?: boolean;
  notif_promos?: boolean;
  notif_new_hotels?: boolean;
  totp_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requires_2fa: boolean; temp_token?: string } | void>;
  register: (email: string, password: string, name: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `access_token=${token};path=/;max-age=${60 * 60 * 24 * 7}`; // 7 days
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=;path=/;max-age=0';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    // Also set cookie for middleware to read
    setAuthCookie(token);
    auth
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('token');
        clearAuthCookie();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<{ requires_2fa: boolean; temp_token?: string } | void> => {
    const result = await auth.login(email, password);
    if (result.requires_2fa) {
      return { requires_2fa: true, temp_token: result.temp_token };
    }
    if (result.token && result.user) {
      localStorage.setItem('token', result.token);
      setAuthCookie(result.token);
      setUser(result.user);
    }
  };

  const register = async (email: string, password: string, name: string, referralCode?: string) => {
    const { user: u, token } = await auth.register(email, password, name, referralCode);
    localStorage.setItem('token', token);
    setAuthCookie(token);
    setUser(u);
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      clearAuthCookie();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
