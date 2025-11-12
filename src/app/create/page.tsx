import { CreateRecipeForm } from './create-form';
import Link from 'next/link';

export default function CreateRecipePage() {
	return (
		<div className="min-h-screen bg-brand-cream-soft">
			<div className="container mx-auto px-4 py-10">
				<div className="mx-auto flex max-w-3xl flex-col gap-8">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold text-brand-secondary">Add new recipe</h1>
							<p className="text-gray-600">
								Share your latest creation. Provide at least a title, description, servings, prep time, cook time, and steps.
							</p>
						</div>
						<Link
							href="/"
							className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
						>
							Back to recipes
						</Link>
					</div>
					<div className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm">
						<CreateRecipeForm />
					</div>
				</div>
			</div>
		</div>
	);
}


