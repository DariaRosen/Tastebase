'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { RecipeCard } from '@/components/recipe-card';
import { createClient } from '@/lib/supabase';

type OwnedRecipeRow = {
  id: number;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  recipe_saves: { count: number | null }[] | null;
};

type RecipeCardData = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  wishlistCount?: number;
  tags?: string[];
  authorName: string;
  authorAvatar?: string;
};

export default function MyRecipesClient() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    const loadOwnRecipes = async () => {
      if (!userId) {
        setRecipes([]);
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
          recipe_saves ( count )
        `
        )
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message ?? 'Failed to load your recipes.');
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      const mapped: RecipeCardData[] = (data ?? []).map((recipe: OwnedRecipeRow) => ({
        id: recipe.id.toString(),
        title: recipe.title,
        description: recipe.description ?? undefined,
        imageUrl: recipe.hero_image_url ?? undefined,
        prepTime: recipe.prep_minutes ?? undefined,
        cookTime: recipe.cook_minutes ?? undefined,
        servings: recipe.servings ?? undefined,
        wishlistCount: recipe.recipe_saves?.[0]?.count ?? undefined,
        tags: recipe.tags ?? undefined,
        authorName: 'You',
        authorAvatar: undefined,
      }));

      setRecipes(mapped);
      setIsLoading(false);
    };

    loadOwnRecipes();

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-brand-secondary">My recipes</h1>
            <p className="text-gray-600">All the recipes you have published.</p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            + Add new recipe
          </Link>
        </div>

        {!userId ? (
          <div className="rounded-xl border border-border-subtle bg-brand-cream-soft p-6 text-center text-brand-secondary">
            Sign in to manage your recipes.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
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
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white p-12 text-center">
            <p className="text-lg font-medium text-gray-700">You have not published any recipes yet</p>
            <p className="text-sm text-gray-500">Create your first recipe to see it here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
