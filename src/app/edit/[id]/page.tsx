import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabaseServer';
import { Header } from '@/components/header';
import { EditRecipeForm } from './edit-form';

type RecipeRow = {
	id: number;
	author_id: string | null;
	title: string;
	description: string | null;
	hero_image_url: string | null;
	servings: number | null;
	prep_minutes: number | null;
	cook_minutes: number | null;
	tags: string[] | null;
	profiles:
		| {
				full_name: string | null;
				username: string | null;
				avatar_url: string | null;
		  }
		| null;
	recipe_ingredients: {
		position: number;
		name: string;
		quantity: string | null;
		unit: string | null;
		note: string | null;
	}[];
	recipe_steps: {
		position: number;
		instruction: string;
	}[];
};

interface EditRecipePageProps {
	params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
	const resolvedParams = await params;
	const recipeId = Number(resolvedParams.id);
	if (Number.isNaN(recipeId)) {
		notFound();
	}

	const supabase = await createServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/'); // only owners can edit; redirect anonymous users
	}

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
        profiles:profiles!recipes_author_id_fkey (
          full_name,
          username,
          avatar_url
        ),
        recipe_ingredients (
          position,
          name,
          quantity,
          unit,
          note
        ),
        recipe_steps (
          position,
          instruction
        )
      `
		)
		.eq('id', recipeId)
		.maybeSingle<RecipeRow>();

	if (error || !recipe) {
		notFound();
	}

	if (recipe.author_id !== user.id) {
		redirect(`/recipe/${recipeId}`);
	}

	const profile = recipe.profiles;

	const ingredients = (recipe.recipe_ingredients ?? [])
		.sort((a, b) => a.position - b.position)
		.map((ingredient) => {
			const parts = [
				ingredient.quantity?.trim(),
				ingredient.unit?.trim(),
				ingredient.name.trim(),
			].filter(Boolean);
			return parts.join(' ');
		});

	const steps = (recipe.recipe_steps ?? [])
		.sort((a, b) => a.position - b.position)
		.map((step) => step.instruction);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-10">
				<div className="mb-6 flex justify-end">
					<Link
						href="/"
						className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
					>
						Back to recipes
					</Link>
				</div>

				<div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
					<h1 className="mb-6 text-3xl font-bold text-brand-secondary">Edit recipe</h1>
					<EditRecipeForm
						initial={{
							id: recipe.id,
							title: recipe.title,
							description: recipe.description ?? '',
							heroImageUrl: recipe.hero_image_url,
							servings: recipe.servings,
							prepMinutes: recipe.prep_minutes,
							cookMinutes: recipe.cook_minutes,
							tags: recipe.tags ?? [],
							ingredients,
							steps,
						}}
					/>
					{recipe.hero_image_url && (
						<div className="mt-6">
							<p className="mb-2 text-sm font-medium text-gray-700">Current hero image</p>
							<div className="relative h-48 w-full max-w-lg overflow-hidden rounded-2xl border">
								<Image
									src={recipe.hero_image_url}
									alt={recipe.title}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 33vw"
								/>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}


