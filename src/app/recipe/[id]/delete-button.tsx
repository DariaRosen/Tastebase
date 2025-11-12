'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteRecipeAction } from './actions';

interface DeleteRecipeButtonProps {
  recipeId: number;
}

export function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm('Delete this recipe? This action cannot be undone.')) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteRecipeAction(recipeId);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? 'Deleting…' : 'Delete recipe'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
