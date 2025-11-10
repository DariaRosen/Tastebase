'use client';

import { useActionState } from 'react';
import { createRecipeAction, type CreateRecipeState } from './actions';

const initialState: CreateRecipeState = {};

export const CreateRecipeForm = () => {
	const [state, formAction, isPending] = useActionState(createRecipeAction, initialState);

	return (
		<form action={formAction} className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2">
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Title</span>
					<input
						name="title"
						required
						minLength={3}
						placeholder="Smoky Harissa Chickpea Skillet"
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
						aria-describedby={state.errors?.title ? 'title-error' : undefined}
					/>
					{state.errors?.title && <span id="title-error" className="mt-1 text-xs text-red-600">{state.errors.title}</span>}
				</label>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Hero image</span>
					<input
						name="heroImage"
						type="file"
						accept="image/*"
						className="mt-1 text-sm text-gray-600"
					/>
					<span className="mt-1 text-xs text-gray-500">Upload a JPG/PNG under 5MB. Optional but looks great.</span>
				</label>
			</div>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Description</span>
				<textarea
					name="description"
					required
					rows={3}
					placeholder="One-pan chickpeas in harissa tomato sauce with preserved lemon and herbs."
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
					aria-describedby={state.errors?.description ? 'description-error' : undefined}
				/>
				{state.errors?.description && (
					<span id="description-error" className="mt-1 text-xs text-red-600">
						{state.errors.description}
					</span>
				)}
			</label>

			<div className="grid gap-6 md:grid-cols-3">
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Servings</span>
					<input
						name="servings"
						type="number"
						required
						min={1}
						placeholder="4"
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
						aria-describedby={state.errors?.servings ? 'servings-error' : undefined}
					/>
					{state.errors?.servings && (
						<span id="servings-error" className="mt-1 text-xs text-red-600">
							{state.errors.servings}
						</span>
					)}
				</label>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Prep minutes</span>
					<input
						name="prepMinutes"
						type="number"
						required
						min={0}
						placeholder="10"
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
						aria-describedby={state.errors?.prepMinutes ? 'prepMinutes-error' : undefined}
					/>
					{state.errors?.prepMinutes && (
						<span id="prepMinutes-error" className="mt-1 text-xs text-red-600">
							{state.errors.prepMinutes}
						</span>
					)}
				</label>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Cook minutes</span>
					<input
						name="cookMinutes"
						type="number"
						required
						min={0}
						placeholder="20"
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
						aria-describedby={state.errors?.cookMinutes ? 'cookMinutes-error' : undefined}
					/>
					{state.errors?.cookMinutes && (
						<span id="cookMinutes-error" className="mt-1 text-xs text-red-600">
							{state.errors.cookMinutes}
						</span>
					)}
				</label>
			</div>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Tags</span>
				<input
					name="tags"
					placeholder="vegan, spicy, one-pan"
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
				/>
				<span className="mt-1 text-xs text-gray-500">Separate tags with commas.</span>
			</label>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Ingredients (one per line)</span>
				<textarea
					name="ingredients"
					rows={6}
					placeholder={`1 cup cooked chickpeas\n2 tbsp harissa paste\n1 preserved lemon peel, minced`}
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
				/>
				<span className="mt-1 text-xs text-gray-500">You can include quantity and unit (e.g., "1 cup all-purpose flour").</span>
			</label>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Steps (one per line)</span>
				<textarea
					name="steps"
					rows={6}
					placeholder={`Sauté shallot in olive oil until translucent.\nAdd chickpeas, tomatoes, and preserved lemon; simmer 10 minutes.\nFinish with cilantro and serve with warm flatbread.`}
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
				/>
			</label>

			<button
				type="submit"
				disabled={isPending}
				className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
			>
				{isPending ? 'Publishing…' : 'Publish recipe'}
			</button>

			{state.message && !state.errors && (
				<p className="text-sm text-green-600">{state.message}</p>
			)}
			{state.message && state.errors && (
				<p className="text-sm text-red-600">{state.message}</p>
			)}
		</form>
	);
};


