"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  showCount = false,
  count = 0,
  interactive = false,
  onRate,
  className = "",
}: StarRatingProps) {
  const starSize = sizeMap[size];
  const textSize = textSizeMap[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }, (_, i) => {
          const starIndex = i + 1;
          const filled = rating >= starIndex;
          const halfFilled = !filled && rating >= starIndex - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(starIndex)}
              className={`relative ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"} focus:outline-none disabled:opacity-100`}
              aria-label={interactive ? `Rate ${starIndex} star${starIndex !== 1 ? "s" : ""}` : undefined}
            >
              {/* Background (empty) star */}
              <Star
                className={`${starSize} text-muted-foreground/25`}
                fill="currentColor"
                strokeWidth={0}
              />

              {/* Filled overlay */}
              {(filled || halfFilled) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star
                    className={`${starSize} text-amber-400`}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showValue && rating > 0 && (
        <span className={`${textSize} font-semibold text-foreground ml-0.5`}>
          {rating.toFixed(1)}
        </span>
      )}

      {showCount && (
        <span className={`${textSize} text-muted-foreground ml-0.5`}>
          ({count}{count === 1 ? " review" : " reviews"})
        </span>
      )}

      {!showCount && !showValue && rating === 0 && (
        <span className={`${textSize} text-muted-foreground ml-0.5`}>
          No ratings
        </span>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: Record<number, number>;
  totalReviews: number;
}

export function RatingDistribution({
  distribution,
  totalReviews,
}: RatingDistributionProps) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-right text-muted-foreground text-xs font-medium">
              {star}
            </span>
            <Star className="size-3 text-amber-400 shrink-0" fill="currentColor" strokeWidth={0} />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-7 text-right text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
