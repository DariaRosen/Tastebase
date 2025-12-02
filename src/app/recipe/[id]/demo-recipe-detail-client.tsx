'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { SaveRecipeToggle } from '@/components/save-recipe-toggle';
import {
	getDemoSession,
	getDemoRecipeById,
	getRecipeSaveCount,
	type DemoRecipeData,
} from '@/lib/demo-auth';

interface DemoRecipeDetailClientProps {
	recipeId: number;
}

interface DemoRecipeIngredientLike {
	position: number;
	quantity?: string | null;
	unit?: string | null;
	name: string;
	note?: string | null;
}

interface DemoRecipeForDetail extends Omit<DemoRecipeData, 'recipe_ingredients' | 'recipe_steps'> {
	recipe_ingredients: DemoRecipeIngredientLike[];
	recipe_steps: {
		position: number;
		instruction: string;
	}[];
}

export const DemoRecipeDetailClient = ({ recipeId }: DemoRecipeDetailClientProps) => {
	const router = useRouter();
	const [recipe, setRecipe] = useState<DemoRecipeForDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isOwner, setIsOwner] = useState(false);
	const [wishlistCount, setWishlistCount] = useState(0);

	useEffect(() => {
		let isMounted = true;

		const loadRecipe = () => {
			try {
				const loaded = getDemoRecipeById(recipeId) as DemoRecipeForDetail | null;

				if (!isMounted) {
					return;
				}

				if (!loaded) {
					setError('Recipe not found.');
					setIsLoading(false);
					return;
				}

				setRecipe(loaded);

				const demoUser = getDemoSession();
				if (demoUser && demoUser.id === loaded.author_id) {
					setIsOwner(true);
				}

				const count = getRecipeSaveCount(recipeId);
				setWishlistCount(count);
				setIsLoading(false);
			} catch (loadError) {
				if (!isMounted) {
					return;
				}
				console.error('[DemoRecipeDetailClient] load error', loadError);
				setError('Failed to load recipe.');
				setIsLoading(false);
			}
		};

		loadRecipe();

		return () => {
			isMounted = false;
		};
	}, [recipeId]);

	const sortedIngredients = useMemo(() => {
		if (!recipe) {
			return [];
		}
		return [...recipe.recipe_ingredients].sort(
			(first, second) => first.position - second.position,
		);
	}, [recipe]);

	const sortedSteps = useMemo(() => {
		if (!recipe) {
			return [];
		}
		return [...recipe.recipe_steps].sort((first, second) => first.position - second.position);
	}, [recipe]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<main className="container mx-auto px-4 py-10">
					<div className="h-72 animate-pulse rounded-3xl bg-brand-cream-soft" />
				</main>
			</div>
		);
	}

	if (error || !recipe) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<main className="container mx-auto px-4 py-10">
					<div className="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-white p-8 text-center">
						<p className="mb-4 text-lg font-semibold text-brand-secondary">{error ?? 'Recipe not found.'}</p>
						<button
							type="button"
							onClick={() => router.push('/')}
							className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
						>
							Back to recipes
						</button>
					</div>
				</main>
			</div>
		);
	}

	const servings = recipe.servings ?? null;
	const prepMinutes = recipe.prep_minutes ?? null;
	const cookMinutes = recipe.cook_minutes ?? null;

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-10">
				<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
					{isOwner && (
						<div className="flex items-center gap-3">
							<Link
								href={`/edit/${recipe.id}`}
								className="inline-flex items-center justify-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-brand-cream"
							>
								Edit recipe
							</Link>
							{/* In demo mode we do not support server-side delete yet */}
						</div>
					)}
					<Link
						href="/"
						className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
					>
						Back to recipes
					</Link>
				</div>

				<section className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-6">
						<div className="relative mx-auto h-[350px] w-[min(100%,500px)] overflow-hidden rounded-3xl border border-border-subtle bg-brand-cream">
							{recipe.hero_image_url ? (
								<Image
									src={recipe.hero_image_url}
									alt={recipe.title}
									fill
									className="object-cover"
									sizes="500px"
									priority
								/>
							) : (
								<div className="flex h-full items-center justify-center text-6xl text-brand-secondary">
									🍽️
								</div>
							)}
						</div>

						<div className="flex flex-col gap-6 rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="space-y-3">
									<h1 className="text-3xl font-bold text-brand-secondary">{recipe.title}</h1>
								</div>
								<SaveRecipeToggle
									recipeId={recipe.id}
									initialSaved={false}
									initialCount={wishlistCount}
								/>
							</div>

							{recipe.description && (
								<p className="text-lg text-gray-700">{recipe.description}</p>
							)}

							<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
								{prepMinutes !== null && (
									<div>
										<span className="font-medium text-brand-secondary">Prep:</span>{' '}
										{prepMinutes} min
									</div>
								)}
								{cookMinutes !== null && (
									<div>
										<span className="font-medium text-brand-secondary">Cook:</span>{' '}
										{cookMinutes} min
									</div>
								)}
								{servings !== null && (
									<div>
										<span className="font-medium text-brand-secondary">Servings:</span>{' '}
										{servings}
									</div>
								)}
								{recipe.difficulty && (
									<div>
										<span className="font-medium text-brand-secondary">Difficulty:</span>{' '}
										{recipe.difficulty}
									</div>
								)}
								<div>
									<span className="font-medium text-brand-secondary">Wishlist:</span>{' '}
									{wishlistCount}
								</div>
							</div>

							{recipe.tags && recipe.tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{recipe.tags.map((tag: string) => (
										<span
											key={tag}
											className="rounded-full bg-brand-cream-soft px-3 py-1 text-xs font-medium text-brand-secondary"
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</div>

						<section className="rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
							<h2 className="mb-4 text-2xl font-semibold text-brand-secondary">Ingredients</h2>
							<ul className="space-y-3 text-gray-700">
								{sortedIngredients.map((ingredient, index) => {
									const quantity = ingredient.quantity ?? null;
									const unit = ingredient.unit ?? null;
									const note = ingredient.note ?? null;
									const parts = [quantity?.trim(), unit?.trim(), ingredient.name.trim()].filter(
										Boolean,
									);
									return (
										<li key={`${ingredient.position}-${ingredient.name}-${index}`}>
											<span className="font-medium">{parts.join(' ')}</span>
											{note && (
												<span className="text-sm text-gray-500"> – {note}</span>
											)}
										</li>
									);
								})}
							</ul>
						</section>

						<section className="rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
							<h2 className="mb-4 text-2xl font-semibold text-brand-secondary">Steps</h2>
							<ol className="list-decimal space-y-4 pl-6 text-gray-700">
								{sortedSteps.map((step) => (
									<li
										key={`${step.position}-${step.instruction}`}
										className="leading-relaxed"
									>
										{step.instruction}
									</li>
								))}
							</ol>
						</section>
					</div>

					<aside className="flex flex-col gap-6">
						<div className="rounded-3xl border border-border-subtle bg-brand-cream-soft p-6 text-sm text-brand-secondary">
							<h3 className="mb-2 text-lg font-semibold text-brand-secondary">Chef&apos;s tip</h3>
							<p>
								Save recipes to your wishlist to build a personal cooking plan. We&apos;ll show new
								inspiration based on what you love.
							</p>
						</div>
						<div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
							<h3 className="mb-3 text-lg font-semibold text-brand-secondary">
								Need more inspiration?
							</h3>
							<p className="text-sm text-gray-600">
								Check the Popular tab on the home page to find the most-saved recipes in the
								community this week.
							</p>
							<Link
								href="/"
								className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
							>
								Browse recipes
							</Link>
						</div>
					</aside>
				</section>
			</main>
		</div>
	);
};


