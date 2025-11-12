import { CreateRecipeForm } from './create-form';
import Link from 'next/link';

export default function CreateRecipePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-10">
				<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-gray-900">Add new recipe</h1>
						<p className="text-gray-600">
							Share your latest creation. Provide at least a title, description, servings, prep time, cook time, and
							steps.
						</p>
					</div>
					<Link
						href="/"
						className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
					>
						Back to recipes
					</Link>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<CreateRecipeForm />
				</div>
			</div>
		</div>
	);
}


