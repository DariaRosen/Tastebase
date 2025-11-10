import { CreateRecipeForm } from './create-form';

export default function CreateRecipePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-10">
				<div className="mb-8 space-y-2">
					<h1 className="text-3xl font-bold text-gray-900">Add new recipe</h1>
					<p className="text-gray-600">
						Share your latest creation. Provide at least a title, description, servings, prep time, cook time, and
						steps.
					</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<CreateRecipeForm />
				</div>
			</div>
		</div>
	);
}


