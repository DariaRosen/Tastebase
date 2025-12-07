'use client';

import { FormEvent, useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
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
  wishlistCount: number;
  tags?: string[];
  difficulty?: string;
};

interface SearchResultsClientProps {
  initialQuery: string;
}

const skeletonArray = Array.from({ length: 6 });

export default function SearchResultsClient({ initialQuery }: SearchResultsClientProps) {
  const router = useRouter();

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setIsLoggedIn(Boolean(data.user));
        setUserId(data.user?.id ?? null);
      } catch {
        setIsLoggedIn(false);
        setUserId(null);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchRecipes = async () => {
      if (!currentQuery.trim()) {
        setRecipes([]);
        setSavedIds(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recipes/search?q=${encodeURIComponent(currentQuery.trim())}`);
        if (!response.ok) {
          throw new Error('Failed to search recipes');
        }
        const { data } = await response.json();

        if (!mounted) {
          return;
        }

        const mapped: RecipeCardData[] = ((data ?? []) as RecipeRow[]).map((recipe) => {
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
            wishlistCount: saveCount,
            tags: recipe.tags ?? undefined,
            difficulty: recipe.difficulty ?? undefined,
          };
        });

        setRecipes(mapped);

        if (userId) {
          const savedIdsResponse = await fetch('/api/recipes/saved-ids');
          if (savedIdsResponse.ok) {
            const { data: savedIdsData } = await savedIdsResponse.json();
            if (mounted) {
              setSavedIds(new Set((savedIdsData ?? []).map((id: string) => id.toString())));
            }
          }
        } else {
          setSavedIds(new Set());
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load results.');
          setRecipes([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecipes();

    return () => {
      mounted = false;
    };
  }, [currentQuery, userId]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = queryInput.trim();
      if (!trimmed) {
        return;
      }
      startTransition(() => {
        setCurrentQuery(trimmed);
        router.push(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
      });
    },
    [queryInput, router],
  );

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
                    wishlistCount: Math.max(recipe.wishlistCount - 1, 0),
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
                    wishlistCount: recipe.wishlistCount + 1,
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
    <>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative flex items-center">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search recipes, ingredients, or tags..."
            className="h-12 w-full rounded-l-full border border-border-subtle bg-white px-5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            aria-label="Search for recipes"
          />
          <button
            type="submit"
            className="flex h-12 w-14 items-center justify-center rounded-r-full bg-brand-primary text-white transition hover:bg-brand-primary-hover"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonArray.map((_, index) => (
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
      ) : currentQuery.trim() ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">No recipes found</p>
          <p className="text-sm text-gray-500">Try a different search term.</p>
        </div>
      ) : null}
    </>
  );
}
