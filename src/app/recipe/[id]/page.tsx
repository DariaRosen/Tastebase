import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabaseServer';
import { Header } from '@/components/header';
import { SaveRecipeToggle } from '@/components/save-recipe-toggle';
import { DeleteRecipeButton } from './delete-button';

type RecipeDetailRow = {
	id: number;
	author_id: string | null;
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
	const resolvedParams = await params;
	const recipeId = Number(resolvedParams.id);
	if (Number.isNaN(recipeId)) {
		notFound();
	}

	const supabase = await createServerSupabase();

	const { data: recipe, error } = await supabase
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
		.maybeSingle<RecipeDetailRow>();

	if (error) {
		if (error.message) {
			console.error('[RecipeDetail] fetch error', { recipeId, message: error.message });
		}
		notFound();
	}

	if (!recipe) {
		console.warn('[RecipeDetail] no recipe found', { recipeId });
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
	const isOwner = user?.id && recipe.author_id === user.id;

	const ingredients = (recipe.recipe_ingredients ?? []).sort(
		(a, b) => a.position - b.position,
	);
	const steps = (recipe.recipe_steps ?? []).sort((a, b) => a.position - b.position);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-10">
				<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
					{isOwner && (
						<div className="flex items-center gap-3">
							<Link
								href={`/edit/${recipe.id}`}
								className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
							>
								Edit recipe
							</Link>
							<DeleteRecipeButton recipeId={recipe.id} />
						</div>
					)}
					<Link
						href="/"
						className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
					>
						← Back to recipes
					</Link>
				</div>

				<section className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-6">
						<div className="relative mx-auto h-[350px] w-[min(100%,500px)] overflow-hidden rounded-3xl bg-gray-200">
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
										{recipe.tags.map((tag: string) => (
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
									Check the Popular tab on the home page to find the most-saved recipes in the
									community this week.
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


