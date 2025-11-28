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
		difficulty: string;
	};
}

const initialState: UpdateRecipeState = {};

const difficultyOptions = ['Easy', 'Intermediate', 'Advanced'] as const;

export const EditRecipeForm = ({ initial }: EditRecipeFormProps) => {
	const router = useRouter();
	const action = updateRecipeAction.bind(null, initial.id, initial.heroImageUrl);
	const [state, formAction, isPending] = useActionState(action, initialState);

	const [title, setTitle] = useState<string>(initial.title);
	const [description, setDescription] = useState<string>(initial.description);
	const [ingredients, setIngredients] = useState<string[]>(initial.ingredients.length > 0 ? initial.ingredients : ['']);
	const [steps, setSteps] = useState<string[]>(initial.steps.length > 0 ? initial.steps : ['']);
	const [difficulty, setDifficulty] = useState<string>(initial.difficulty ?? 'Easy');

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
		router.push(state.redirectTo);
	}, [state.redirectTo, router]);

	return (
		<form action={formAction} className="space-y-6">
			<input type="hidden" name="existingHeroImageUrl" value={initial.heroImageUrl ?? ''} />

			<div className="grid gap-6 md:grid-cols-2">
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Title</span>
					<input
						id="title"
						name="title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						required
						minLength={3}
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
					id="description"
					name="description"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					required
					rows={4}
					className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
						aria-describedby={state.errors?.cookMinutes ? 'cookMinutes-error' : undefined}
					/>
					{state.errors?.cookMinutes && (
						<span id="cookMinutes-error" className="mt-1 text-xs text-red-600">
							{state.errors.cookMinutes}
						</span>
					)}
				</label>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<span className="text-sm font-medium text-gray-700">Difficulty</span>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						{difficultyOptions.map((option) => {
							const inputId = `edit-difficulty-${option.toLowerCase()}`;
							return (
								<label
									key={option}
									htmlFor={inputId}
									className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-secondary ${
										difficulty === option
											? 'border-brand-primary bg-brand-cream-soft text-brand-secondary'
											: 'border-border-subtle text-gray-600 hover:bg-brand-cream'
									}`}
								>
									<input
										id={inputId}
										type="radio"
										name="difficulty"
										value={option}
										checked={difficulty === option}
										onChange={(event) => setDifficulty(event.target.value)}
										className="sr-only"
									/>
									{option}
								</label>
							);
						})}
					</div>
					{state.errors?.difficulty && <span className="text-xs text-red-600">{state.errors.difficulty}</span>}
				</div>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Tags</span>
					<input
						name="tags"
						defaultValue={initial.tags.join(', ')}
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
					/>
					<span className="mt-1 text-xs text-gray-500">Separate tags with commas.</span>
				</label>
			</div>

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
								className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
							/>
							<button
								type="button"
								onClick={() => removeIngredient(index)}
								className="text-sm font-medium text-brand-primary hover:underline"
								aria-label="Remove ingredient"
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
						className="text-sm font-medium text-brand-primary hover:underline"
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
								className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
							/>
							<button
								type="button"
								onClick={() => removeStep(index)}
								className="text-sm font-medium text-brand-primary hover:underline"
								aria-label="Remove step"
							>
								Remove
							</button>
						</div>
					))}
					{state.errors?.steps && <span className="text-xs text-red-600">{state.errors.steps}</span>}
					<button
						type="button"
						onClick={() => addStep()}
						className="text-sm font-medium text-brand-primary hover:underline"
					>
						+ Add Step
					</button>
				</div>
			</div>

			<button
				type="submit"
				disabled={isPending}
				className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:opacity-60"
			>
				{isPending ? 'Saving…' : 'Save changes'}
			</button>

			{state.message && state.errors && <p className="text-sm text-red-600">{state.message}</p>}
		</form>
	);
};


