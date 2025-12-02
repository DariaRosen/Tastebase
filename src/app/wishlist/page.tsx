'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { RecipeCard } from '@/components/recipe-card';
import type { RecipeRow } from '@/lib/data-service';

type RecipeCardData = {
  id: string;
  title: string;
  description?: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  wishlistCount?: number;
  tags?: string[];
  difficulty?: string;
};

export default function WishlistPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setUserId(data.user?.id ?? null);
      } catch {
        setUserId(null);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadSaved = async () => {
      if (!userId) {
        setRecipes([]);
        setSavedIds(new Set());
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const [savedResponse, savedIdsResponse] = await Promise.all([
          fetch('/api/recipes/saved'),
          fetch('/api/recipes/saved-ids'),
        ]);

        if (!savedResponse.ok || !savedIdsResponse.ok) {
          throw new Error('Failed to load wishlist');
        }

        const { data: savedData } = await savedResponse.json();
        const { data: savedIdsData } = await savedIdsResponse.json();

        if (!mounted) return;

        const mapped: RecipeCardData[] = ((savedData ?? []) as RecipeRow[]).map((recipe) => {
          const saveCount = recipe.recipe_saves?.[0]?.count ?? 0;
          const profile = recipe.profiles;
          const author = profile?.full_name || profile?.username || 'Unknown cook';
          return {
            id: recipe.id.toString(),
            title: recipe.title,
            description: recipe.description ?? undefined,
            imageUrl: recipe.hero_image_url ?? undefined,
            authorName: author,
            authorAvatar: profile?.avatar_url ?? undefined,
            prepTime: recipe.prep_minutes ?? undefined,
            cookTime: recipe.cook_minutes ?? undefined,
            servings: recipe.servings ?? undefined,
            wishlistCount: saveCount ?? undefined,
            tags: recipe.tags ?? undefined,
            difficulty: recipe.difficulty ?? undefined,
          };
        });

        setRecipes(mapped);
        setSavedIds(new Set((savedIdsData ?? []).map((id: string) => id.toString())));
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load wishlist.');
          setRecipes([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSaved();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleToggleSave = useCallback(
    async (recipeId: string) => {
      if (!userId) {
        setError('Please sign in to use your wishlist.');
        setTimeout(() => setError(null), 2000);
        return;
      }

      const currentlySaved = savedIds.has(recipeId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(recipeId)) {
          next.delete(recipeId);
        } else {
          next.add(recipeId);
        }
        return next;
      });

      try {
        if (currentlySaved) {
          const response = await fetch(`/api/recipes/${recipeId}/unsave`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('Failed to unsave recipe');
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.id === recipeId
                ? {
                    ...recipe,
                    wishlistCount: Math.max((recipe.wishlistCount ?? 1) - 1, 0),
                  }
                : recipe,
            ),
          );
        } else {
          const response = await fetch(`/api/recipes/${recipeId}/save`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('Failed to save recipe');
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.id === recipeId
                ? {
                    ...recipe,
                    wishlistCount: (recipe.wishlistCount ?? 0) + 1,
                  }
                : recipe,
            ),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update wishlist');
        setTimeout(() => setError(null), 2000);
        // Revert optimistic update
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) {
            next.add(recipeId);
          } else {
            next.delete(recipeId);
          }
          return next;
        });
      }
    },
    [savedIds, userId],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-brand-secondary">My wishlist</h1>
          <p className="text-gray-600">Recipes you have saved for later.</p>
        </div>

        {!userId ? (
          <div className="rounded-xl border border-border-subtle bg-brand-cream-soft p-6 text-center text-brand-secondary">
            Sign in to view your wishlist.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-xl bg-brand-cream/60" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-brand-accent/30 bg-brand-cream-soft p-6 text-center text-brand-accent">
            {error}
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                {...recipe}
                isSaved={savedIds.has(recipe.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white p-12 text-center">
            <p className="text-lg font-medium text-gray-700">Your wishlist is empty</p>
            <p className="text-sm text-gray-500">Save recipes you love to see them here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
