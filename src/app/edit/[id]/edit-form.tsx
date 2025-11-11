'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRecipeAction, type UpdateRecipeState } from './actions';

interface EditRecipeFormProps {
	initial: {
		id: number;
		title: string;
		description: string;
		heroImageUrl: string | null;
		servings: number | null;
		prepMinutes: number | null;
		cookMinutes: number | null;
		tags: string[];
		ingredients: string[];
		steps: string[];
	};
}

const initialState: UpdateRecipeState = {};

export const EditRecipeForm = ({ initial }: EditRecipeFormProps) => {
	const router = useRouter();
	const action = updateRecipeAction.bind(null, initial.id, initial.heroImageUrl);
	const [state, formAction, isPending] = useActionState(action, initialState);

	const [ingredients, setIngredients] = useState<string[]>(initial.ingredients.length > 0 ? initial.ingredients : ['']);
	const [steps, setSteps] = useState<string[]>(initial.steps.length > 0 ? initial.steps : ['']);

	const handleIngredientChange = (index: number, value: string) => {
		setIngredients((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const handleStepChange = (index: number, value: string) => {
		setSteps((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const addIngredient = (atIndex?: number) =>
		setIngredients((prev) => {
			const next = [...prev];
			if (typeof atIndex === 'number') {
				next.splice(atIndex + 1, 0, '');
				return next;
			}
			return [...prev, ''];
		});

	const addStep = (atIndex?: number) =>
		setSteps((prev) => {
			const next = [...prev];
			if (typeof atIndex === 'number') {
				next.splice(atIndex + 1, 0, '');
				return next;
			}
			return [...prev, ''];
		});

	const focusIngredient = (targetIndex: number) => {
		requestAnimationFrame(() => {
			const nodes = document.querySelectorAll<HTMLInputElement>('input[data-ingredient-index]');
			nodes[targetIndex]?.focus();
		});
	};

	const focusStep = (targetIndex: number) => {
		requestAnimationFrame(() => {
			const nodes = document.querySelectorAll<HTMLTextAreaElement>('textarea[data-step-index]');
			nodes[targetIndex]?.focus();
		});
	};

	const handleIngredientKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (!ingredients[index]?.trim()) return;
		addIngredient(index);
		focusIngredient(index + 1);
	};

	const handleStepKeyDown = (index: number, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key !== 'Enter') return;
		if (event.shiftKey) return;
		event.preventDefault();
		if (!steps[index]?.trim()) return;
		addStep(index);
		focusStep(index + 1);
	};

	const removeIngredient = (index: number) => {
		setIngredients((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
	};

	const removeStep = (index: number) => {
		setSteps((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
	};

	useEffect(() => {
		if (!state.message) return;
		if (!state.errors) {
			const timeout = setTimeout(() => {
				router.refresh();
			}, 500);
			return () => clearTimeout(timeout);
		}
	}, [state.message, state.errors, router]);

	return (
		<form action={formAction} className="space-y-6">
			<input type="hidden" name="existingHeroImageUrl" value={initial.heroImageUrl ?? ''} />

			<div className="grid gap-6 md:grid-cols-2">
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Title</span>
					<input
						name="title"
						defaultValue={initial.title}
						required
						minLength={3}
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
						aria-describedby={state.errors?.title ? 'title-error' : undefined}
					/>
					{state.errors?.title && <span id="title-error" className="mt-1 text-xs text-red-600">{state.errors.title}</span>}
				</label>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Hero image</span>
					<input name="heroImage" type="file" accept="image/*" className="mt-1 text-sm text-gray-600" />
					<span className="mt-1 text-xs text-gray-500">Upload a new image to replace the existing one (optional).</span>
				</label>
			</div>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Description</span>
				<textarea
					name="description"
					defaultValue={initial.description}
					required
					rows={3}
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
						defaultValue={initial.servings ?? ''}
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
						defaultValue={initial.prepMinutes ?? ''}
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
						defaultValue={initial.cookMinutes ?? ''}
						className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
					defaultValue={initial.tags.join(', ')}
					className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
				/>
				<span className="mt-1 text-xs text-gray-500">Separate tags with commas.</span>
			</label>

			<div className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Ingredients</span>
				<div className="mt-3 space-y-3">
					{ingredients.map((value, index) => (
						<div key={index} className="flex items-start gap-3">
							<input
								name="ingredients[]"
								value={value}
								onChange={(event) => handleIngredientChange(index, event.target.value)}
								onKeyDown={(event) => handleIngredientKeyDown(index, event)}
								data-ingredient-index={index}
								placeholder="e.g., 2 cups chopped kale"
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
							/>
							<button
								type="button"
								onClick={() => removeIngredient(index)}
								className="text-sm font-medium text-red-600 hover:underline"
							>
								Remove
							</button>
						</div>
					))}
					{state.errors?.ingredients && (
						<span className="text-xs text-red-600">{state.errors.ingredients}</span>
					)}
					<button
						type="button"
						onClick={() => addIngredient()}
						className="text-sm font-medium text-orange-600 hover:underline"
					>
						+ Add Ingredient
					</button>
				</div>
			</div>

			<div className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Instructions</span>
				<div className="mt-3 space-y-3">
					{steps.map((value, index) => (
						<div key={index} className="flex items-start gap-3">
							<textarea
								name="steps[]"
								rows={3}
								value={value}
								onChange={(event) => handleStepChange(index, event.target.value)}
								onKeyDown={(event) => handleStepKeyDown(index, event)}
								data-step-index={index}
								placeholder="Describe this step..."
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
							/>
							<button
								type="button"
								onClick={() => removeStep(index)}
								className="text-sm font-medium text-red-600 hover:underline"
							>
								Remove
							</button>
						</div>
					))}
					{state.errors?.steps && <span className="text-xs text-red-600">{state.errors.steps}</span>}
					<button
						type="button"
						onClick={() => addStep()}
						className="text-sm font-medium text-orange-600 hover:underline"
					>
						+ Add Step
					</button>
				</div>
			</div>

			<button
				type="submit"
				disabled={isPending}
				className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
			>
				{isPending ? 'Saving…' : 'Save changes'}
			</button>

			{state.message && state.errors && <p className="text-sm text-red-600">{state.message}</p>}
		</form>
	);
};


