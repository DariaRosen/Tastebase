'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SaveRecipeToggleProps {
  recipeId: string;
  initialSaved: boolean;
  initialCount: number;
}

export const SaveRecipeToggle = ({
  recipeId,
  initialSaved,
  initialCount,
}: SaveRecipeToggleProps) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const toggleSave = async () => {
    if (isPending) return;
    setIsPending(true);
    setMessage(null);

    try {
      if (isSaved) {
        const response = await fetch(`/api/recipes/${recipeId}/unsave`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          setMessage(data.error || 'Failed to remove from wishlist');
          setIsPending(false);
          return;
        }

        setIsSaved(false);
        setCount((prev) => Math.max(prev - 1, 0));
      } else {
        const response = await fetch(`/api/recipes/${recipeId}/save`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            setMessage('Please sign in to add recipes to your wishlist.');
          } else {
            setMessage(data.error || 'Failed to add to wishlist');
          }
          setIsPending(false);
          return;
        }

        setIsSaved(true);
        setCount((prev) => prev + 1);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    }

    setIsPending(false);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSave}
          disabled={isPending}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition hover:bg-brand-primary/20 disabled:opacity-60"
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className="h-5 w-5"
            fill={isSaved ? '#f57402' : 'transparent'}
            strokeWidth={isSaved ? 1.5 : 2}
            color={isSaved ? '#f57402' : 'currentColor'}
          />
        </button>
        <span className="text-sm text-gray-600">
          {count} save{count === 1 ? '' : 's'}
        </span>
      </div>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
};
