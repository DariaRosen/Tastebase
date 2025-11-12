'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { RecipeCard } from '@/components/recipe-card';

type SupabaseRecipeRow = {
  id: number;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  recipe_saves: { count: number | null }[] | null;
};

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
};

interface SearchResultsClientProps {
  initialQuery: string;
}

const skeletonArray = Array.from({ length: 6 });

export default function SearchResultsClient({ initialQuery }: SearchResultsClientProps) {
  const supabase = useMemo(() => createClient(), []);
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
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setIsLoggedIn(Boolean(data.user));
    })();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, [supabase]);

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

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select(
          `
            id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          `
        )
        .eq('is_published', true)
        .or(
          `title.ilike.%${currentQuery.trim()}%,description.ilike.%${currentQuery.trim()}%`
        )
        .order('published_at', { ascending: false })
        .limit(50);

      if (!mounted) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message ?? 'Failed to load results.');
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      const mapped: RecipeCardData[] = (data ?? []).map((recipe: SupabaseRecipeRow) => {
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
          wishlistCount: recipe.recipe_saves?.[0]?.count ?? 0,
          tags: recipe.tags ?? undefined,
        } satisfies RecipeCardData;
      });

      setRecipes(mapped);

      if (userId) {
        const { data: savedData } = await supabase
          .from('recipe_saves')
          .select('recipe_id')
          .eq('user_id', userId);

        if (mounted) {
          setSavedIds(new Set((savedData ?? []).map((item) => item.recipe_id.toString())));
        }
      } else {
        setSavedIds(new Set());
      }

      setIsLoading(false);
    };

    fetchRecipes();

    return () => {
      mounted = false;
    };
  }, [currentQuery, supabase, userId]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = queryInput.trim();
      startTransition(() => {
        router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
        setCurrentQuery(trimmed);
      });
    },
    [queryInput, router, startTransition]
  );

  const handleToggleSave = useCallback(
    async (recipeId: string) => {
      if (!userId) {
        setError('Please sign in to manage your wishlist.');
        setTimeout(() => setError(null), 2000);
        return;
      }

      const currentlySaved = savedIds.has(recipeId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.delete(recipeId);
        } else {
          next.add(recipeId);
        }
        return next;
      });

      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                wishlistCount: recipe.wishlistCount + (currentlySaved ? -1 : 1),
              }
            : recipe
        )
      );

      if (currentlySaved) {
        await supabase
          .from('recipe_saves')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', Number(recipeId));
      } else {
        await supabase
          .from('recipe_saves')
          .insert({ user_id: userId, recipe_id: Number(recipeId) });
      }
    },
    [savedIds, supabase, userId]
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Search recipes</h1>
          <p className="text-sm text-gray-600">
            Explore dishes by keywords. Try ingredients, cuisines, or chef names.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-secondary/60" />
            <input
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Type a recipe name, ingredient, or chef…"
              aria-label="Search for recipes"
              className="w-full rounded-full border border-border-subtle bg-white py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            Search
          </button>
        </form>

        {!currentQuery && (
          <p className="text-sm text-gray-500">
            Hint: search for favorites like “pasta”, “Szechuan”, or “vegetarian”.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-brand-accent/30 bg-brand-cream-soft p-4 text-sm text-brand-accent">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonArray.map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-brand-cream/60" />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-700">
              Found {recipes.length} recipe{recipes.length === 1 ? '' : 's'}
            </h2>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
            >
              Back to recipes
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                {...recipe}
                isSaved={savedIds.has(recipe.id)}
                onToggleSave={isLoggedIn ? handleToggleSave : undefined}
              />
            ))}
          </div>
        </div>
      ) : currentQuery ? (
        <div className="rounded-3xl border border-border-subtle bg-white p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-800">No recipes found</h2>
          <p className="mt-2 text-sm text-gray-600">
            Try a different keyword or check out the latest creations on the home page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            Browse recipes
          </Link>
        </div>
      ) : null}
    </div>
  );
}
