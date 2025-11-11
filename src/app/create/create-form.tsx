'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRecipeAction, type CreateRecipeState } from './actions';

const initialState: CreateRecipeState = {};

export const CreateRecipeForm = () => {
	const [state, formAction, isPending] = useActionState(createRecipeAction, initialState);
	const router = useRouter();
	const [ingredients, setIngredients] = useState<string[]>(['']);
	const [steps, setSteps] = useState<string[]>(['']);

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
		if (!state.redirectTo) return;
		const timeout = setTimeout(() => {
			router.push(state.redirectTo!);
		}, 800);
		return () => clearTimeout(timeout);
	}, [state.redirectTo, router]);

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
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
						onClick={addIngredient}
						className="text-sm font-medium text-orange-600 hover:underline"
					>
						+ Add Ingredient
					</button>
				</div>
				<span className="mt-2 text-xs text-gray-500">
					Include quantity and unit if relevant, e.g., &quot;1 cup all-purpose flour&quot;.
				</span>
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
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
						onClick={addStep}
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


