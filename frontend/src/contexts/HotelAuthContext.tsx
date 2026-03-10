'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { hotelAuth } from '@/lib/api';

interface Hotel {
  id: number;
  name: string;
}

interface HotelAccount {
  id: number;
  hotelId: number;
  email: string;
  name: string;
}

interface HotelAuthContextType {
  hotel: Hotel | null;
  hotelAccount: HotelAccount | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (hotelId: number, email: string, password: string, name: string) => Promise<{ pending?: boolean } | void>;
  logout: () => void;
}

export const HotelAuthContext = createContext<HotelAuthContextType | null>(null);

export function HotelAuthProvider({ children }: { children: React.ReactNode }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelAccount, setHotelAccount] = useState<HotelAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hotelToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    hotelAuth
      .me()
      .then((res) => {
        const data = res as { hotel: Hotel; hotelAccount: { id: number; hotel_id: number; email: string; name: string } };
        setHotel(data.hotel);
        setHotelAccount(data.hotelAccount ? { ...data.hotelAccount, hotelId: data.hotelAccount.hotel_id } : null);
      })
      .catch(() => {
        localStorage.removeItem('hotelToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = (await hotelAuth.login(email, password)) as {
      token: string;
      hotel: Hotel;
      hotelAccount: { id: number; hotel_id: number; email: string; name: string };
    };
    localStorage.setItem('hotelToken', res.token);
    setHotel(res.hotel);
    setHotelAccount(res.hotelAccount ? { ...res.hotelAccount, hotelId: res.hotelAccount.hotel_id } : null);
  };

  const register = async (hotelId: number, email: string, password: string, name: string) => {
    const res = (await hotelAuth.register(hotelId, email, password, name)) as {
      pending?: boolean;
      message?: string;
      token?: string;
      hotel?: Hotel;
      hotelAccount?: { id: number; hotel_id: number; email: string; name: string };
    };
    if (res.pending) {
      return { pending: true };
    }
    if (res.token) {
      localStorage.setItem('hotelToken', res.token);
      setHotel(res.hotel ?? null);
      setHotelAccount(res.hotelAccount ? { ...res.hotelAccount, hotelId: res.hotelAccount.hotel_id } : null);
    }
  };

  const logout = () => {
    localStorage.removeItem('hotelToken');
    setHotel(null);
    setHotelAccount(null);
  };

  return (
    <HotelAuthContext.Provider
      value={{ hotel, hotelAccount, loading, login, register, logout }}
    >
      {children}
    </HotelAuthContext.Provider>
  );
}

export function useHotelAuth() {
  const ctx = useContext(HotelAuthContext);
  if (!ctx) throw new Error('useHotelAuth must be used within HotelAuthProvider');
  return ctx;
}
