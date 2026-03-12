'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hotels } from '@/lib/api';

export default function PartnerSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  useEffect(() => {
    const id = parseInt(slug, 10);
    if (!isNaN(id) && id > 0) {
      router.replace(`/hotels/${id}`);
      return;
    }
    if (slug) {
      hotels.list({ search: slug, limit: 1 }).then((r) => {
        if (r.hotels.length > 0) router.replace(`/hotels/${r.hotels[0].id}`);
        else router.replace('/hotels');
      }).catch(() => router.replace('/hotels'));
    } else {
      router.replace('/hotels');
    }
  }, [slug, router]);

  return <div className="py-12 text-center text-black dark:text-zinc-400">Redirecting…</div>;
}
