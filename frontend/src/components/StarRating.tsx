'use client';

interface StarRatingProps {
  rating?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  value?: number;
  onChange?: (rating: number) => void;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

function StarFilled({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

function StarEmpty({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

export default function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  value,
  onChange,
}: StarRatingProps) {
  const sizeClass = sizeClasses[size];
  const displayRating = interactive ? (value ?? 0) : (rating ?? 0);
  const fullStars = Math.min(max, Math.round(displayRating));
  const emptyStars = max - fullStars;

  if (interactive && onChange) {
    return (
      <div className="flex gap-0.5" role="group" aria-label={`Rate ${displayRating} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayRating;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(starValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(starValue);
                }
              }}
              className={`p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 rounded ${
                isFilled ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-600'
              }`}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              {isFilled ? <StarFilled className={sizeClass} /> : <StarEmpty className={sizeClass} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${displayRating} out of ${max} stars`}>
      {Array.from({ length: fullStars }, (_, i) => (
        <StarFilled key={`f-${i}`} className={`${sizeClass} text-amber-500`} />
      ))}
      {Array.from({ length: emptyStars }, (_, i) => (
        <StarEmpty key={`e-${i}`} className={`${sizeClass} text-zinc-300 dark:text-zinc-600`} />
      ))}
    </span>
  );
}
