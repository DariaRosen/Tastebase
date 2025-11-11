'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { RecipeCard } from '@/components/recipe-card';
import { createClient } from '@/lib/supabase';

type SavedRecipeRow = {
	recipe_id: number;
	recipes: {
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
	} | null;
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
	wishlistCount?: number;
	tags?: string[];
};

export default function WishlistPage() {
	const supabase = useMemo(() => createClient(), []);
	const [userId, setUserId] = useState<string | null>(null);
	const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
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
		const loadSaved = async () => {
			if (!userId) {
				setRecipes([]);
				setSavedIds(new Set());
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			setError(null);

			const { data, error: fetchError } = await supabase
				.from('recipe_saves')
				.select(
					`
            recipe_id,
            recipes (
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
            )
          `,
				)
				.eq('user_id', userId);

			if (!mounted) return;

			if (fetchError) {
				setError(fetchError.message ?? 'Failed to load wishlist.');
				setRecipes([]);
				setSavedIds(new Set());
				setIsLoading(false);
				return;
			}

			const mapped: RecipeCardData[] =
				((data ?? []) as unknown as SavedRecipeRow[])
					.map((row) => row.recipes)
					.filter((recipe): recipe is NonNullable<SavedRecipeRow['recipes']> => Boolean(recipe))
					.map((recipe) => {
						const saveCount = recipe.recipe_saves?.[0]?.count ?? 0;
						const profile = recipe.profiles;
						const author =
							profile?.full_name || profile?.username || 'Unknown cook';
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
						};
					});

			setRecipes(mapped);
			setSavedIds(new Set(mapped.map((recipe) => recipe.id)));
			setIsLoading(false);
		};

		loadSaved();

		return () => {
			mounted = false;
		};
	}, [supabase, userId]);

	const handleToggleSave = useCallback(
		async (recipeId: string) => {
			if (!userId) {
				setError('Please sign in to manage your wishlist.');
				setTimeout(() => setError(null), 2000);
				return;
			}

			const isSaved = savedIds.has(recipeId);
			setSavedIds((prev) => {
				const next = new Set(prev);
				if (next.has(recipeId)) {
					next.delete(recipeId);
				} else {
					next.add(recipeId);
				}
				return next;
			});

			if (isSaved) {
				setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
				await supabase
					.from('recipe_saves')
					.delete()
					.eq('user_id', userId)
					.eq('recipe_id', Number(recipeId));
			} else {
				await supabase.from('recipe_saves').insert({
					user_id: userId,
					recipe_id: Number(recipeId),
				});
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
		},
		[savedIds, supabase, userId],
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold text-gray-900">Wishlist</h1>
						<p className="text-gray-600">
							All the recipes you saved for later.
						</p>
					</div>
					<Link
						href="/"
						className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-orange-700"
						aria-label="Back to home"
					>
						← Back to recipes
					</Link>
				</div>

				{!userId ? (
					<div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center text-orange-700">
						Sign in to start building your wishlist.
					</div>
				) : isLoading ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 3 }).map((_, index) => (
							<div key={index} className="h-72 animate-pulse rounded-xl bg-gray-200" />
						))}
					</div>
				) : error ? (
					<div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
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
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-12 text-center">
						<p className="text-lg font-medium text-gray-700">No saved recipes yet</p>
						<p className="text-sm text-gray-500">
							Browse the home feed and tap the heart icon to add recipes to your wishlist.
						</p>
					</div>
				)}
			</main>
		</div>
	);
}


