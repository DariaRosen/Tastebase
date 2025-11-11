import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabaseServer';
import { Header } from '@/components/header';
import { SaveRecipeToggle } from '@/components/save-recipe-toggle';

type RecipeDetailRow = {
	id: number;
	title: string;
	description: string | null;
	hero_image_url: string | null;
	servings: number | null;
	prep_minutes: number | null;
	cook_minutes: number | null;
	tags: string[] | null;
	published_at: string | null;
	profiles:
		| {
				full_name: string | null;
				username: string | null;
				avatar_url: string | null;
		  }
		| null;
	recipe_ingredients: {
		position: number;
		quantity: string | null;
		unit: string | null;
		name: string;
		note: string | null;
	}[];
	recipe_steps: {
		position: number;
		instruction: string;
	}[];
	recipe_saves: { count: number | null }[] | null;
};

interface RecipeDetailPageProps {
	params: { id: string };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
	const recipeId = Number(params.id);
	if (Number.isNaN(recipeId)) {
		notFound();
	}

	const supabase = await createServerSupabase();

	const { data: recipe, error } = await supabase
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
        profiles:profiles!recipes_author_id_fkey (
          full_name,
          username,
          avatar_url
        ),
        recipe_ingredients:recipe_ingredients (
          position,
          quantity,
          unit,
          name,
          note
        ),
        recipe_steps:recipe_steps (
          position,
          instruction
        ),
        recipe_saves:recipe_saves ( count )
      `,
		)
		.eq('id', recipeId)
		.eq('is_published', true)
		.order('position', { foreignTable: 'recipe_ingredients', ascending: true })
		.order('position', { foreignTable: 'recipe_steps', ascending: true })
		.single<RecipeDetailRow>();

	if (error || !recipe) {
		notFound();
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	let isSaved = false;
	if (user) {
		const { data: saved } = await supabase
			.from('recipe_saves')
			.select('id')
			.eq('user_id', user.id)
			.eq('recipe_id', recipeId)
			.limit(1)
			.maybeSingle();
		isSaved = Boolean(saved);
	}

	const wishlistCount = recipe.recipe_saves?.[0]?.count ?? 0;
	const profile = recipe.profiles;
	const authorName = profile?.full_name || profile?.username || 'Unknown cook';

	const ingredients = (recipe.recipe_ingredients ?? []).sort(
		(a, b) => a.position - b.position,
	);
	const steps = (recipe.recipe_steps ?? []).sort((a, b) => a.position - b.position);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-10">
				<Link
					href="/"
					className="mb-6 inline-flex items-center text-sm font-medium text-orange-600 hover:underline"
					aria-label="Back to home"
				>
					← Back to recipes
				</Link>

				<section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-6">
						<div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-gray-200">
							{recipe.hero_image_url ? (
								<Image
									src={recipe.hero_image_url}
									alt={recipe.title}
									fill
									className="object-cover"
									sizes="(max-width: 1024px) 100vw, 66vw"
									priority
								/>
							) : (
								<div className="flex h-full items-center justify-center text-6xl">🍽️</div>
							)}
						</div>

						<div className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="space-y-3">
									<h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
									<div className="flex items-center gap-3">
										{profile?.avatar_url ? (
											<div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
												<Image
													src={profile.avatar_url}
													alt={authorName}
													fill
													className="object-cover"
													sizes="40px"
												/>
											</div>
										) : (
											<div className="h-10 w-10 rounded-full bg-gray-300" />
										)}
										<div>
											<p className="text-sm text-gray-500">Recipe by</p>
											<p className="font-medium text-gray-800">{authorName}</p>
										</div>
									</div>
								</div>
								<SaveRecipeToggle
									recipeId={recipe.id}
									initialSaved={isSaved}
									initialCount={wishlistCount}
								/>
							</div>

							{recipe.description && (
								<p className="text-lg text-gray-700">{recipe.description}</p>
							)}

							<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
								{recipe.prep_minutes !== null && (
									<div>
										<span className="font-medium text-gray-800">Prep:</span>{' '}
										{recipe.prep_minutes} min
									</div>
								)}
								{recipe.cook_minutes !== null && (
									<div>
										<span className="font-medium text-gray-800">Cook:</span>{' '}
										{recipe.cook_minutes} min
									</div>
								)}
								{recipe.servings !== null && (
									<div>
										<span className="font-medium text-gray-800">Servings:</span>{' '}
										{recipe.servings}
									</div>
								)}
								<div>
									<span className="font-medium text-gray-800">Wishlist:</span>{' '}
									{wishlistCount}
								</div>
							</div>

							{recipe.tags && recipe.tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{recipe.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600"
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</div>

						<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
							<h2 className="mb-4 text-2xl font-semibold text-gray-900">Ingredients</h2>
							<ul className="space-y-3 text-gray-700">
								{ingredients.map((ingredient, index) => {
									const parts = [
										ingredient.quantity?.trim(),
										ingredient.unit?.trim(),
										ingredient.name.trim(),
									].filter(Boolean);
									return (
										<li key={`${ingredient.position}-${ingredient.name}-${index}`}>
											<span className="font-medium">{parts.join(' ')}</span>
											{ingredient.note && (
												<span className="text-sm text-gray-500"> – {ingredient.note}</span>
											)}
										</li>
									);
								})}
							</ul>
						</section>

						<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
							<h2 className="mb-4 text-2xl font-semibold text-gray-900">Steps</h2>
							<ol className="list-decimal space-y-4 pl-6 text-gray-700">
								{steps.map((step) => (
									<li key={`${step.position}-${step.instruction}`} className="leading-relaxed">
										{step.instruction}
									</li>
								))}
							</ol>
						</section>
					</div>

					<aside className="flex flex-col gap-6">
						<div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-sm text-orange-700">
							<h3 className="mb-2 text-lg font-semibold text-orange-800">Chef&apos;s tip</h3>
							<p>
								Save recipes to your wishlist to build a personal cooking plan. We&apos;ll show new
								inspiration based on what you love.
							</p>
						</div>
						<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
							<h3 className="mb-3 text-lg font-semibold text-gray-900">Need more inspiration?</h3>
							<p className="text-sm text-gray-600">
								Check the Popular tab on the home page to find the most-saved recipes in the community
								this week.
							</p>
							<Link
								href="/"
								className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
							>
								Browse recipes
							</Link>
						</div>
					</aside>
				</section>
			</main>
		</div>
	);
}

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Users, Heart } from 'lucide-react';
import { Header } from '@/components/header';
import { createServerSupabase } from '@/lib/supabaseServer';
import { WishlistToggle } from './wishlist-toggle';

interface RecipePageProps {
	params: { id: string };
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
	const id = Number(params.id);
	if (!Number.isFinite(id)) {
		notFound();
	}

	const supabase = await createServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data: recipe, error: recipeError } = await supabase
		.from('recipes')
		.select(
			`
        id,
        author_id,
        title,
        description,
        hero_image_url,
        servings,
        prep_minutes,
        cook_minutes,
        tags,
        is_published,
        published_at,
        profiles:profiles!recipes_author_id_fkey (
          id,
          full_name,
          username,
          avatar_url,
          bio
        ),
        recipe_saves:recipe_saves ( count )
      `,
		)
		.eq('id', id)
		.maybeSingle();

	if (recipeError || !recipe) {
		notFound();
	}

	if (!recipe.is_published && recipe.author_id !== user?.id) {
		notFound();
	}

	const saveCount = recipe.recipe_saves?.[0]?.count ?? 0;

	const { data: ingredients } = await supabase
		.from('recipe_ingredients')
		.select('position, quantity, unit, name, note')
		.eq('recipe_id', id)
		.order('position', { ascending: true });

	const { data: steps } = await supabase
		.from('recipe_steps')
		.select('position, instruction')
		.eq('recipe_id', id)
		.order('position', { ascending: true });

	let isSaved = false;
	if (user) {
		const { data: savedRow } = await supabase
			.from('recipe_saves')
			.select('recipe_id')
			.eq('recipe_id', id)
			.eq('user_id', user.id)
			.maybeSingle();
		isSaved = Boolean(savedRow);
	}

	const totalTime = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="mx-auto w-full max-w-5xl px-4 py-10">
				<Link
					href="/"
					className="inline-flex items-center text-sm font-medium text-orange-600 hover:underline"
				>
					← Back to recipes
				</Link>

				<div className="mt-6 grid gap-10 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-6">
						<div className="overflow-hidden rounded-3xl bg-gray-100">
							{recipe.hero_image_url ? (
								<Image
									src={recipe.hero_image_url}
									alt={recipe.title}
									width={960}
									height={640}
									className="h-full w-full object-cover"
									sizes="(max-width: 768px) 100vw, 70vw"
								/>
							) : (
								<div className="flex h-[320px] items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 text-5xl">
									🍽️
								</div>
							)}
						</div>

						<section>
							<h2 className="text-xl font-semibold text-gray-900">Description</h2>
							<p className="mt-2 text-gray-700">{recipe.description ?? 'No description provided.'}</p>
							{recipe.tags && recipe.tags.length > 0 && (
								<div className="mt-4 flex flex-wrap gap-2">
									{recipe.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</section>

						<section className="grid gap-6 md:grid-cols-2">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
								<ul className="mt-4 space-y-3">
									{ingredients?.map((ingredient) => (
										<li key={ingredient.position} className="flex items-start gap-2 text-gray-700">
											<span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
											<span>
												<strong>{[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}</strong>{' '}
												{ingredient.name}
												{ingredient.note ? <span className="text-gray-500"> — {ingredient.note}</span> : null}
											</span>
										</li>
									))}
									{!ingredients?.length && <li className="text-sm text-gray-500">No ingredients listed yet.</li>}
								</ul>
							</div>
							<div>
								<h2 className="text-xl font-semibold text-gray-900">Steps</h2>
								<ol className="mt-4 space-y-4">
									{steps?.map((step) => (
										<li key={step.position} className="flex gap-3 text-gray-700">
											<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
												{step.position + 1}
											</span>
											<span>{step.instruction}</span>
										</li>
									))}
									{!steps?.length && <li className="text-sm text-gray-500">No steps provided yet.</li>}
								</ol>
							</div>
						</section>
					</div>

					<aside className="space-y-6 self-start rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
							<p className="text-sm text-gray-500">
								Published{' '}
								{recipe.published_at
									? new Date(recipe.published_at).toLocaleDateString()
									: 'draft'}
							</p>
						</div>
						<div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
							{totalTime > 0 && (
								<div className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-orange-500" />
									<div>
										<p className="font-medium text-gray-900">{totalTime} min</p>
										<p className="text-xs text-gray-500">Total time</p>
									</div>
								</div>
							)}
							{recipe.prep_minutes !== null && (
								<div className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-orange-500" />
									<div>
										<p className="font-medium text-gray-900">{recipe.prep_minutes} min</p>
										<p className="text-xs text-gray-500">Prep</p>
									</div>
								</div>
							)}
							{recipe.cook_minutes !== null && (
								<div className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-orange-500" />
									<div>
										<p className="font-medium text-gray-900">{recipe.cook_minutes} min</p>
										<p className="text-xs text-gray-500">Cook</p>
									</div>
								</div>
							)}
							{recipe.servings && (
								<div className="flex items-center gap-2">
									<Users className="h-5 w-5 text-orange-500" />
									<div>
										<p className="font-medium text-gray-900">{recipe.servings}</p>
										<p className="text-xs text-gray-500">Servings</p>
									</div>
								</div>
							)}
						</div>

						<div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
							{recipe.profiles?.avatar_url ? (
								<Image
									src={recipe.profiles.avatar_url}
									alt={recipe.profiles.full_name ?? recipe.profiles.username ?? 'Author'}
									width={56}
									height={56}
									className="h-14 w-14 rounded-full object-cover"
								/>
							) : (
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-500">
									{(recipe.profiles?.full_name ?? recipe.profiles?.username ?? '?')[0]}
								</div>
							)}
							<div>
								<p className="text-sm text-gray-500">Created by</p>
								<p className="text-base font-medium text-gray-900">
									{recipe.profiles?.full_name ?? recipe.profiles?.username ?? 'Unknown cook'}
								</p>
								{recipe.profiles?.bio && <p className="text-xs text-gray-500">{recipe.profiles.bio}</p>}
							</div>
						</div>

						<WishlistToggle
							recipeId={recipe.id}
							userId={user?.id ?? null}
							initialIsSaved={isSaved}
							initialCount={saveCount}
						/>

						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Heart className="h-4 w-4" />
							<span>{saveCount} saved this</span>
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
}


