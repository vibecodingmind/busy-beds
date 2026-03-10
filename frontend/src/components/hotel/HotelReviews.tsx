'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reviews } from '@/lib/api';

interface Props {
  hotelId: number;
}

export default function HotelReviews({ hotelId }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<{
    reviews: { id: number; rating: number; comment: string | null; user_name: string; created_at: string }[];
    averageRating: number | null;
    totalCount: number;
  } | null>(null);
  const [myReview, setMyReview] = useState<{ id: number; rating: number; comment: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reviews.list(hotelId).then(setData).catch(() => {});
    if (user) {
      reviews.myReview(hotelId).then((r) => {
        const rev = r.review || null;
        setMyReview(rev);
        if (rev) {
          setRating(rev.rating);
          setComment(rev.comment || '');
        }
      }).catch(() => {});
    }
  }, [hotelId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await reviews.create(hotelId, rating, comment || undefined);
      const [listRes, myRes] = await Promise.all([
        reviews.list(hotelId),
        reviews.myReview(hotelId),
      ]);
      setData(listRes);
      setMyReview(myRes.review || null);
      setComment('');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Reviews</h3>
      {data.averageRating != null && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {data.averageRating.toFixed(1)} ★ ({data.totalCount} {data.totalCount === 1 ? 'review' : 'reviews'})
        </p>
      )}
      {user && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl ${rating >= n ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a review..."
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {myReview ? 'Update review' : 'Submit review'}
          </button>
        </form>
      )}
      <ul className="mt-6 space-y-4">
        {data.reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.user_name}</span>
              <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.comment}</p>}
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
      {data.reviews.length === 0 && (
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">No reviews yet. Be the first to review!</p>
      )}
    </div>
  );
}
