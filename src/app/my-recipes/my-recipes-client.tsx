'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { RecipeCard } from '@/components/recipe-card';
import { DeleteRecipeButton } from '@/app/recipe/[id]/delete-button';
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

export default function MyRecipesClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const loadOwnRecipes = async () => {
      if (!userId) {
        setRecipes([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/recipes/my-recipes');
        if (!response.ok) {
          throw new Error('Failed to load recipes');
        }
        const { data } = await response.json();

        if (!mounted) return;

        const mapped: RecipeCardData[] = ((data ?? []) as RecipeRow[]).map((recipe) => {
          const profile = recipe.profiles;
          const author = profile?.full_name || profile?.username || 'You';
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
            wishlistCount: recipe.recipe_saves?.[0]?.count ?? undefined,
            tags: recipe.tags ?? undefined,
            difficulty: recipe.difficulty ?? undefined,
          };
        });

        setRecipes(mapped);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load your recipes.');
          setRecipes([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadOwnRecipes();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleDeleteRecipe = useCallback(
    async (recipeId: string) => {
      if (!userId || isDeleting) {
        return;
      }

      const shouldDelete = window.confirm('Delete this recipe? This action cannot be undone.');
      if (!shouldDelete) {
        return;
      }

      setIsDeleting(true);
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete recipe');
        }

        setRecipes((previous) => previous.filter((recipe) => recipe.id !== recipeId));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete recipe. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, userId],
  );

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
              <div key={recipe.id} className="flex flex-col gap-3">
                <Link href={`/recipe/${recipe.id}`} className="block h-full">
                  <RecipeCard {...recipe} />
                </Link>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/edit/${recipe.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-brand-secondary transition hover:bg-brand-cream-soft"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center rounded-lg border border-brand-accent/50 px-3 py-1.5 text-xs font-medium text-brand-accent transition hover:bg-brand-cream-soft disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
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
