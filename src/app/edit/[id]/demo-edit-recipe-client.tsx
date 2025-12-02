'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/header';
import { USE_SUPABASE } from '@/lib/data-config';
import {
	getDemoSession,
	getDemoRecipeById,
	updateDemoRecipe,
	type DemoRecipeData,
} from '@/lib/demo-auth';

interface DemoEditRecipeClientProps {
	recipeId: number;
}

const difficultyOptions = ['Easy', 'Intermediate', 'Advanced'] as const;

export const DemoEditRecipeClient = ({ recipeId }: DemoEditRecipeClientProps) => {
	const router = useRouter();
	const [recipe, setRecipe] = useState<DemoRecipeData | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [servings, setServings] = useState<number | ''>('');
	const [prepMinutes, setPrepMinutes] = useState<number | ''>('');
	const [cookMinutes, setCookMinutes] = useState<number | ''>('');
	const [tagsInput, setTagsInput] = useState('');
	const [difficulty, setDifficulty] = useState<string>('Easy');
	const [ingredients, setIngredients] = useState<string[]>(['']);
	const [steps, setSteps] = useState<string[]>(['']);
	const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
	const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
	const heroImageInputRef = useRef<HTMLInputElement>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (USE_SUPABASE) {
			// Should never happen for this component, but guard just in case.
			router.replace(`/recipe/${recipeId}`);
			return;
		}

		let isMounted = true;

		const loadRecipe = () => {
			try {
				const demoUser = getDemoSession();
				if (!demoUser) {
					if (!isMounted) return;
					setError('You must be signed in to edit a recipe.');
					setIsLoading(false);
					return;
				}

				const loaded = getDemoRecipeById(recipeId);
				if (!isMounted) return;

				if (!loaded) {
					setError('Recipe not found.');
					setIsLoading(false);
					return;
				}

				if (loaded.author_id !== demoUser.id) {
					setError('You can only edit your own recipes.');
					setIsLoading(false);
					return;
				}

				setRecipe(loaded);
				setTitle(loaded.title);
				setDescription(loaded.description ?? '');
				setServings(loaded.servings ?? '');
				setPrepMinutes(loaded.prep_minutes ?? '');
				setCookMinutes(loaded.cook_minutes ?? '');
				setTagsInput((loaded.tags ?? []).join(', '));
				setDifficulty(loaded.difficulty ?? 'Easy');

				const initialIngredients =
					loaded.recipe_ingredients.length > 0
						? loaded.recipe_ingredients
								.sort((first, second) => first.position - second.position)
								.map((ingredient) => {
									const parts = [ingredient.quantity?.trim(), ingredient.name.trim()].filter(Boolean);
									return parts.join(' ');
								})
						: [''];
				setIngredients(initialIngredients);

				const initialSteps =
					loaded.recipe_steps.length > 0
						? loaded.recipe_steps
								.sort((first, second) => first.position - second.position)
								.map((step) => step.instruction)
						: [''];
				setSteps(initialSteps);

				setHeroImagePreview(loaded.hero_image_url);
				setIsLoading(false);
			} catch (loadError) {
				if (!isMounted) return;
				console.error('[DemoEditRecipeClient] load error', loadError);
				setError('Failed to load recipe.');
				setIsLoading(false);
			}
		};

		loadRecipe();

		return () => {
			isMounted = false;
		};
	}, [recipeId, router]);

	const handleIngredientChange = (index: number, value: string) => {
		setIngredients((previous) => {
			const next = [...previous];
			next[index] = value;
			return next;
		});
	};

	const handleStepChange = (index: number, value: string) => {
		setSteps((previous) => {
			const next = [...previous];
			next[index] = value;
			return next;
		});
	};

	const addIngredient = (atIndex?: number) =>
		setIngredients((previous) => {
			const next = [...previous];
			if (typeof atIndex === 'number') {
				next.splice(atIndex + 1, 0, '');
				return next;
			}
			return [...previous, ''];
		});

	const addStep = (atIndex?: number) =>
		setSteps((previous) => {
			const next = [...previous];
			if (typeof atIndex === 'number') {
				next.splice(atIndex + 1, 0, '');
				return next;
			}
			return [...previous, ''];
		});

	const handleIngredientKeyDown = (
		index: number,
		event: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (!ingredients[index]?.trim()) return;
		addIngredient(index);
	};

	const handleStepKeyDown = (
		index: number,
		event: React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		if (!steps[index]?.trim()) return;
		addStep(index);
	};

	const handleRemoveIngredient = (index: number) => {
		setIngredients((previous) => (previous.length === 1 ? [''] : previous.filter((_, i) => i !== index)));
	};

	const handleRemoveStep = (index: number) => {
		setSteps((previous) => (previous.length === 1 ? [''] : previous.filter((_, i) => i !== index)));
	};

	const handleHeroImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (heroImagePreview && heroImagePreview.startsWith('blob:')) {
			URL.revokeObjectURL(heroImagePreview);
		}
		setHeroImageFile(file);
		const previewUrl = URL.createObjectURL(file);
		setHeroImagePreview(previewUrl);
	};

	const handleRemoveHeroImage = () => {
		if (heroImagePreview && heroImagePreview.startsWith('blob:')) {
			URL.revokeObjectURL(heroImagePreview);
		}
		setHeroImageFile(null);
		setHeroImagePreview(null);
		if (heroImageInputRef.current) {
			heroImageInputRef.current.value = '';
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!recipe || isSaving) {
			return;
		}

		const demoUser = getDemoSession();
		if (!demoUser || demoUser.id !== recipe.author_id) {
			alert('You can only edit your own recipes.');
			return;
		}

		if (!title.trim() || !description.trim()) {
			alert('Title and description are required.');
			return;
		}

		const numericServings = typeof servings === 'string' ? Number(servings) : servings;
		const numericPrep = typeof prepMinutes === 'string' ? Number(prepMinutes) : prepMinutes;
		const numericCook = typeof cookMinutes === 'string' ? Number(cookMinutes) : cookMinutes;

		if (!numericServings || numericServings < 1) {
			alert('Servings must be at least 1.');
			return;
		}
		if (numericPrep === null || Number.isNaN(numericPrep) || numericPrep < 0) {
			alert('Prep minutes must be zero or more.');
			return;
		}
		if (numericCook === null || Number.isNaN(numericCook) || numericCook < 0) {
			alert('Cook minutes must be zero or more.');
			return;
		}

		const ingredientValues = ingredients.map((value) => value.trim()).filter(Boolean);
		const stepValues = steps.map((value) => value.trim()).filter(Boolean);

		if (ingredientValues.length === 0) {
			alert('Add at least one ingredient.');
			return;
		}
		if (stepValues.length === 0) {
			alert('Add at least one step.');
			return;
		}

		setIsSaving(true);

		let heroImageUrl = recipe.hero_image_url;
		if (heroImageFile) {
			try {
				const uploadFormData = new FormData();
				uploadFormData.append('file', heroImageFile);
				uploadFormData.append('folder', 'Tastebase/recipe-images');

				const uploadResponse = await fetch('/api/upload-image', {
					method: 'POST',
					body: uploadFormData,
				});

				if (uploadResponse.ok) {
					const { url } = await uploadResponse.json();
					heroImageUrl = url;
				} else {
					const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
					console.error('Image upload error:', errorData.error);
				}
			} catch (uploadError) {
				console.error('Image upload error:', uploadError);
			}
		}

		const ingredientRows = ingredientValues.map((line, index) => {
			const match = line.match(/^([0-9/.\s]+)\s+(.*)$/);
			if (!match) {
				return {
					position: index,
					quantity: null,
					name: line,
				};
			}
			const [_, quantity, name] = match;
			return {
				position: index,
				quantity: quantity.trim(),
				name: name.trim(),
			};
		});

		const stepRows = stepValues.map((instruction, index) => ({
			position: index,
			instruction,
		}));

		const tagArray = tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);

		const updated = updateDemoRecipe(recipe.id, {
			title: title.trim(),
			description: description.trim() || null,
			hero_image_url: heroImageUrl,
			servings: numericServings,
			prep_minutes: numericPrep,
			cook_minutes: numericCook,
			tags: tagArray.length > 0 ? tagArray : null,
			difficulty: difficulty || null,
			recipe_ingredients: ingredientRows,
			recipe_steps: stepRows,
		});

		setIsSaving(false);

		if (!updated) {
			alert('Failed to save changes. Please try again.');
			return;
		}

		router.push(`/recipe/${recipe.id}`);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<main className="container mx-auto px-4 py-10">
					<div className="h-72 animate-pulse rounded-3xl bg-brand-cream-soft" />
				</main>
			</div>
		);
	}

	if (error || !recipe) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<main className="container mx-auto px-4 py-10">
					<div className="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-white p-8 text-center">
						<p className="mb-4 text-lg font-semibold text-brand-secondary">
							{error ?? 'Recipe not found.'}
						</p>
						<button
							type="button"
							onClick={() => router.push('/my-recipes')}
							className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
						>
							Back to My recipes
						</button>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<main className="container mx-auto px-4 py-10">
				<div className="mb-6 flex justify-end">
					<button
						type="button"
						onClick={() => router.push(`/recipe/${recipe.id}`)}
						className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
					>
						Back to recipe
					</button>
				</div>

				<div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-sm">
					<h1 className="mb-6 text-3xl font-bold text-brand-secondary">Edit recipe</h1>

					<form onSubmit={handleSubmit} className="space-y-6">
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
								/>
							</label>

							<label className="flex flex-col text-sm text-gray-700 w-full">
								<span className="font-medium">Hero image</span>
								<div className="mt-1 flex flex-wrap items-start gap-4 w-full">
									<div className="flex-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<input
												ref={heroImageInputRef}
												name="heroImage"
												type="file"
												accept="image/*"
												onChange={handleHeroImageChange}
												className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-hover"
											/>
											{heroImageFile && (
												<button
													type="button"
													onClick={handleRemoveHeroImage}
													className="text-sm font-medium text-red-600 hover:underline whitespace-nowrap"
												>
													Remove
												</button>
											)}
										</div>
										{heroImageFile && (
											<span className="mt-1 block text-sm font-semibold text-brand-primary">
												Selected: {heroImageFile.name}
											</span>
										)}
										<span className="mt-1 text-xs text-gray-500">
											Upload a new image to replace the existing one (optional).
										</span>
									</div>
									{heroImagePreview && (
										<div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-gray-100">
											<Image
												src={heroImagePreview}
												alt="Hero image preview"
												fill
												className="object-cover"
												sizes="80px"
											/>
										</div>
									)}
								</div>
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
							/>
						</label>

						<div className="grid gap-6 md:grid-cols-3">
							<label className="flex flex-col text-sm text-gray-700">
								<span className="font-medium">Servings</span>
								<input
									name="servings"
									type="number"
									required
									min={1}
									value={servings}
									onChange={(event) =>
										setServings(event.target.value === '' ? '' : Number(event.target.value))
									}
									className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
								/>
							</label>
							<label className="flex flex-col text-sm text-gray-700">
								<span className="font-medium">Prep minutes</span>
								<input
									name="prepMinutes"
									type="number"
									required
									min={0}
									value={prepMinutes}
									onChange={(event) =>
										setPrepMinutes(event.target.value === '' ? '' : Number(event.target.value))
									}
									className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
								/>
							</label>
							<label className="flex flex-col text-sm text-gray-700">
								<span className="font-medium">Cook minutes</span>
								<input
									name="cookMinutes"
									type="number"
									required
									min={0}
									value={cookMinutes}
									onChange={(event) =>
										setCookMinutes(event.target.value === '' ? '' : Number(event.target.value))
									}
									className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
								/>
							</label>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<span className="text-sm font-medium text-gray-700">Difficulty</span>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
									{difficultyOptions.map((option) => {
										const inputId = `demo-edit-difficulty-${option.toLowerCase()}`;
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
							</div>

							<label className="flex flex-col text-sm text-gray-700">
								<span className="font-medium">Tags</span>
								<input
									name="tags"
									value={tagsInput}
									onChange={(event) => setTagsInput(event.target.value)}
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
											onChange={(event) =>
												handleIngredientChange(index, event.target.value)
											}
											onKeyDown={(event) => handleIngredientKeyDown(index, event)}
											data-ingredient-index={index}
											placeholder="e.g., 2 cups chopped kale"
											className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
										/>
										<button
											type="button"
											onClick={() => handleRemoveIngredient(index)}
											className="text-sm font-medium text-brand-primary hover:underline"
											aria-label="Remove ingredient"
										>
											Remove
										</button>
									</div>
								))}
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
											onClick={() => handleRemoveStep(index)}
											className="text-sm font-medium text-brand-primary hover:underline"
											aria-label="Remove step"
										>
											Remove
										</button>
									</div>
								))}
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
							disabled={isSaving}
							className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:opacity-60"
						>
							{isSaving ? 'Saving…' : 'Save changes'}
						</button>
					</form>
				</div>
			</main>
		</div>
	);
};


