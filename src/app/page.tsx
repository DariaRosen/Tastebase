'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { TabSwitcher } from '@/components/tab-switcher';
import { RecipeCard } from '@/components/recipe-card';
import { createClient } from '@/lib/supabase';

type Tab = 'latest' | 'popular';

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
	publishedAt?: string | null;
	difficulty?: string;
};

type SupabaseRecipeRow = {
	id: number;
	title: string;
	description: string | null;
	hero_image_url: string | null;
	servings: number | null;
	prep_minutes: number | null;
	cook_minutes: number | null;
	tags: string[] | null;
	published_at: string | null;
	difficulty: string | null;
	profiles:
		| {
				full_name: string | null;
				username: string | null;
				avatar_url: string | null;
		  }
		| null;
	recipe_saves: { count: number | null }[] | null;
};

export default function Home() {
	const [activeTab, setActiveTab] = useState<Tab>('latest');
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const { data } = await supabase.auth.getUser();
			if (!mounted) return;
			setIsLoggedIn(Boolean(data.user));
			setUserId(data.user?.id ?? null);
		})();
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
			setIsLoggedIn(Boolean(session?.user));
			setUserId(session?.user?.id ?? null);
		});
		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
	}, [supabase]);

	useEffect(() => {
		let mounted = true;

		const loadRecipes = async () => {
			setIsLoading(true);
			setError(null);

			const query = supabase
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
            published_at,
            difficulty,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          `
				)
				.eq('is_published', true)
				.limit(30);

			if (activeTab === 'latest') {
				query.order('published_at', { ascending: false });
			}

			const { data, error: fetchError } = await query;

			if (!mounted) return;

			if (fetchError) {
				setError(fetchError.message ?? 'Failed to load recipes.');
				setRecipes([]);
				setIsLoading(false);
				return;
			}

			const mapped: RecipeCardData[] =
				((data ?? []) as unknown as SupabaseRecipeRow[]).map((recipe) => {
					const saveCount = recipe.recipe_saves?.[0]?.count ?? 0;
					const profile = recipe.profiles;
					const author =
						profile?.full_name ||
						profile?.username ||
						'Unknown cook';
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
						publishedAt: recipe.published_at ?? undefined,
						difficulty: recipe.difficulty ?? undefined,
					};
				});

			let sorted = mapped;
			if (activeTab === 'popular') {
				sorted = [...mapped].sort(
					(a, b) => (b.wishlistCount ?? 0) - (a.wishlistCount ?? 0)
				);
			}

			setRecipes(sorted);

			if (userId) {
				const { data: savedData } = await supabase
					.from('recipe_saves')
					.select('recipe_id')
					.eq('user_id', userId);
				if (mounted) {
					setSavedIds(
						new Set(
							(savedData ?? []).map((item) => item.recipe_id.toString()),
						),
					);
				}
			} else {
				setSavedIds(new Set());
			}
			setIsLoading(false);
		};

		loadRecipes();

		return () => {
			mounted = false;
		};
	}, [activeTab, supabase, userId]);

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

			if (currentlySaved) {
				await supabase
					.from('recipe_saves')
					.delete()
					.eq('user_id', userId)
					.eq('recipe_id', Number(recipeId));
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

	const availableCategories = useMemo(() => {
		const categorySet = new Set<string>();
		recipes.forEach((recipe) => {
			(recipe.tags ?? []).forEach((tag) => {
				if (tag.trim()) {
					categorySet.add(tag.trim());
				}
			});
		});
		return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
	}, [recipes]);

	const availableDifficulties = ['Easy', 'Intermediate', 'Advanced'];

	const filteredRecipes = useMemo(() => {
		return recipes.filter((recipe) => {
			const matchesDifficulty = selectedDifficulty ? recipe.difficulty === selectedDifficulty : true;
			const matchesCategory = selectedCategory ? (recipe.tags ?? []).includes(selectedCategory) : true;
			return matchesDifficulty && matchesCategory;
		});
	}, [recipes, selectedCategory, selectedDifficulty]);

	const hasActiveFilters = Boolean(selectedCategory || selectedDifficulty);

	const handleSelectCategory = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setSelectedCategory(value === 'ALL' ? null : value);
	}, []);

	const handleSelectDifficulty = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setSelectedDifficulty(value === 'ALL' ? null : value);
	}, []);

	const handleClearFilters = useCallback(() => {
		setSelectedCategory(null);
		setSelectedDifficulty(null);
	}, []);

	return (
		<div className="min-h-screen bg-brand-cream-soft">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold text-brand-secondary">Discover Amazing Recipes</h1>
						<p className="text-gray-600">Explore delicious recipes from our community of home cooks</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex flex-col text-xs uppercase tracking-wide text-gray-500">
							<label htmlFor="category-filter" className="mb-1 text-[0.65rem] font-semibold text-brand-secondary">
								Category
							</label>
							<select
								id="category-filter"
								value={selectedCategory ?? 'ALL'}
								onChange={handleSelectCategory}
								className="h-10 rounded-full border border-border-subtle bg-white px-4 text-sm text-brand-secondary/80 shadow-sm focus:border-brand-secondary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
							>
								<option value="ALL">All categories</option>
								{availableCategories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col text-xs uppercase tracking-wide text-gray-500">
							<label htmlFor="difficulty-filter" className="mb-1 text-[0.65rem] font-semibold text-brand-secondary">
								Difficulty
							</label>
							<select
								id="difficulty-filter"
								value={selectedDifficulty ?? 'ALL'}
								onChange={handleSelectDifficulty}
								className="h-10 rounded-full border border-border-subtle bg-white px-4 text-sm text-brand-secondary/80 shadow-sm focus:border-brand-secondary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
							>
								<option value="ALL">All difficulties</option>
								{availableDifficulties.map((difficulty) => (
									<option key={difficulty} value={difficulty}>
										{difficulty}
									</option>
								))}
							</select>
						</div>
						{hasActiveFilters && (
							<button
								type="button"
								onClick={handleClearFilters}
								className="text-sm font-medium text-brand-primary hover:underline"
							>
								Clear
							</button>
						)}
						{isLoggedIn && (
							<Link
								href="/create"
								className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
								aria-label="Add new recipe"
							>
								Add new recipe
							</Link>
						)}
					</div>
				</div>

				<TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

				<div className="mt-8">
					{isLoading ? (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, index) => (
								<div
									key={index}
									className="h-72 animate-pulse rounded-xl bg-brand-cream/60"
								/>
							))}
						</div>
					) : error ? (
						<div className="rounded-xl border border-brand-accent/30 bg-brand-cream-soft p-6 text-center text-brand-accent">
							{error}
						</div>
					) : filteredRecipes.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{filteredRecipes.map((recipe) => (
								<RecipeCard
									key={recipe.id}
									{...recipe}
									isSaved={savedIds.has(recipe.id)}
									onToggleSave={handleToggleSave}
								/>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-white p-12 text-center">
							<p className="mb-2 text-lg text-gray-600">No recipes match the current filters</p>
							<p className="text-sm text-gray-500">
								{hasActiveFilters
									? 'Try clearing or adjusting the filters to see more recipes.'
									: 'Be the first to share a recipe!'}
							</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
