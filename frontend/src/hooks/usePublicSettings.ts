'use client';

import { useEffect, useState } from 'react';
import { getPublicSettings } from '@/lib/api';

export interface PublicSettings {
  site_name?: string;
  support_email?: string;
  terms_url?: string;
  privacy_url?: string;
  google_maps_api_key?: string;
}

export function usePublicSettings(): PublicSettings | null {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  return settings;
}

export function useGoogleMapsApiKey(): string | null {
  const settings = usePublicSettings();
  return settings?.google_maps_api_key ?? null;
}
