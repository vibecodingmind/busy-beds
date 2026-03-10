'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import { useContext } from 'react';
import { reviews } from '@/lib/api';
import StarRating from '@/components/StarRating';

interface Props {
  hotelId: number;
  hotelName?: string;
}

export default function HotelReviews({ hotelId, hotelName }: Props) {
  const { user } = useAuth();
  const hotelAuth = useContext(HotelAuthContext);
  const isHotelForThisProperty = hotelAuth?.hotel?.id === hotelId;
  const [data, setData] = useState<{
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
  } | null>(null);
  const [myReview, setMyReview] = useState<{ id: number; rating: number; comment: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseForReview, setResponseForReview] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [sort, setSort] = useState<'recent' | 'rating_high' | 'rating_low' | 'verified_first'>('recent');

  useEffect(() => {
    reviews.list(hotelId, sort).then(setData).catch(() => {});
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
  }, [hotelId, user, sort]);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Reviews</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="recent">Most recent</option>
          <option value="rating_high">Highest rated</option>
          <option value="rating_low">Lowest rated</option>
          <option value="verified_first">Verified first</option>
        </select>
      </div>
      {data.averageRating != null && (
        <p className="mt-1 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <StarRating rating={data.averageRating} size="md" />
          {data.averageRating.toFixed(1)} ({data.totalCount} {data.totalCount === 1 ? 'review' : 'reviews'})
        </p>
      )}
      {user && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-1">
            <StarRating interactive value={rating} onChange={setRating} size="lg" />
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.user_name}</span>
                {r.verified_guest && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    Verified guest
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={r.rating} size="sm" />
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await reviews.voteHelpful(r.id, true);
                            const listRes = await reviews.list(hotelId, sort);
                            setData(listRes);
                          } catch {
                            //
                          }
                        }}
                        className={`hover:text-emerald-600 ${r.user_vote === true ? 'text-emerald-600 font-medium' : ''}`}
                      >
                        Helpful {(r.helpful_count ?? 0) > 0 ? `(${r.helpful_count})` : ''}
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await reviews.voteHelpful(r.id, false);
                            const listRes = await reviews.list(hotelId, sort);
                            setData(listRes);
                          } catch {
                            //
                          }
                        }}
                        className={`hover:text-zinc-700 dark:hover:text-zinc-300 ${r.user_vote === false ? 'font-medium' : ''}`}
                      >
                        Not helpful {(r.not_helpful_count ?? 0) > 0 ? `(${r.not_helpful_count})` : ''}
                      </button>
                    </>
                  ) : (
                    <span>
                      {(r.helpful_count ?? 0) + (r.not_helpful_count ?? 0) > 0 &&
                        `${r.helpful_count ?? 0} helpful`}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({
                        title: `Review of ${hotelName || 'Hotel'}`,
                        text: `${r.user_name}: ${(r.comment || '').slice(0, 100)}...`,
                        url: typeof window !== 'undefined' ? window.location.href : '',
                      });
                    } else {
                      navigator.clipboard?.writeText(window.location.href + '#reviews');
                    }
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
                >
                  Share
                </button>
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.comment}</p>}
            {r.hotel_response && (
              <div className="mt-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 dark:bg-emerald-950/30 dark:border-emerald-600">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hotel response</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{r.hotel_response.response_text}</p>
                <p className="mt-1 text-xs text-zinc-500">{new Date(r.hotel_response.created_at).toLocaleDateString()}</p>
              </div>
            )}
            {isHotelForThisProperty && !r.hotel_response && (
              <div className="mt-3">
                {responseForReview === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write a response..."
                      rows={2}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={responseLoading}
                        onClick={async () => {
                          if (!responseText.trim()) return;
                          setResponseLoading(true);
                          try {
                            await reviews.addResponse(r.id, responseText);
                            const listRes = await reviews.list(hotelId);
                            setData(listRes);
                            setResponseForReview(null);
                            setResponseText('');
                          } finally {
                            setResponseLoading(false);
                          }
                        }}
                        className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResponseForReview(null);
                          setResponseText('');
                        }}
                        className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResponseForReview(r.id)}
                    className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Respond to review
                  </button>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
      {data.reviews.length === 0 && (
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">No reviews yet. Be the first to review!</p>
      )}
    </div>
  );
}
