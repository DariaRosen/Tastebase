import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { EditRecipeForm } from './edit-form';
import { fetchRecipeById } from '@/lib/data-service';
import { getCurrentUser } from '@/lib/auth-service';

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const resolvedParams = await params;
  const recipeId = resolvedParams.id;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const { data: recipe, error } = await fetchRecipeById(null, recipeId);

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
              difficulty: recipe.difficulty ?? 'Easy',
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
