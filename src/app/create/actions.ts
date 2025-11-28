'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';
import { createServerSupabase } from '@/lib/supabaseServer';

export interface CreateRecipeState {
	errors?: Record<string, string>;
	message?: string;
	redirectTo?: string;
	heroImageUrl?: string;
}

const parseNumber = (value: FormDataEntryValue | null) => {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const allowedDifficulties = ['Easy', 'Intermediate', 'Advanced'] as const;

export async function createRecipeAction(
	_prevState: CreateRecipeState,
	formData: FormData
): Promise<CreateRecipeState> {
	const title = formData.get('title')?.toString().trim() ?? '';
	const description = formData.get('description')?.toString().trim() ?? '';
	const servings = parseNumber(formData.get('servings'));
	const prepMinutes = parseNumber(formData.get('prepMinutes'));
	const cookMinutes = parseNumber(formData.get('cookMinutes'));
	const tagsInput = formData.get('tags')?.toString() ?? '';
	const heroImageFile = formData.get('heroImage');
	const difficultyRaw = formData.get('difficulty')?.toString().trim() ?? '';
	const ingredientValues = formData
		.getAll('ingredients[]')
		.map((value) => value.toString().trim())
		.filter(Boolean);
	const stepValues = formData
		.getAll('steps[]')
		.map((value) => value.toString().trim())
		.filter(Boolean);

	const errors: Record<string, string> = {};
	if (!title) errors.title = 'Title is required.';
	if (!description) errors.description = 'Description is required.';
	if (!servings) errors.servings = 'Servings must be a positive number.';
	if (!prepMinutes && prepMinutes !== 0) errors.prepMinutes = 'Prep minutes must be zero or more.';
	if (!cookMinutes && cookMinutes !== 0) errors.cookMinutes = 'Cook minutes must be zero or more.';

	if (ingredientValues.length === 0) {
		errors.ingredients = 'Add at least one ingredient.';
	}
	if (stepValues.length === 0) {
		errors.steps = 'Add at least one step.';
	}
	if (!allowedDifficulties.includes(difficultyRaw as typeof allowedDifficulties[number])) {
		errors.difficulty = 'Select a difficulty level.';
	}

	if (Object.keys(errors).length > 0) {
		return { errors, message: 'Please fix the highlighted fields.' };
	}

	try {
		const supabase = await createServerSupabase({ shouldSetCookies: true });
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { message: 'You must be signed in to create a recipe.' };
		}

		let heroImageUrl: string | null = null;
		if (heroImageFile instanceof File && heroImageFile.size > 0) {
			if (!heroImageFile.type.startsWith('image/')) {
				return { message: 'Uploaded file must be an image.' };
			}
			if (heroImageFile.size > 5 * 1024 * 1024) {
				return { message: 'Image must be 5MB or smaller.' };
			}

			const fileExt = heroImageFile.name.split('.').pop() ?? 'jpg';
			const filePath = `${user.id}/${Date.now()}.${fileExt}`;
			const arrayBuffer = await heroImageFile.arrayBuffer();
			const { error: uploadError } = await supabase.storage
				.from('recipe-images')
				.upload(filePath, Buffer.from(arrayBuffer), {
					cacheControl: '3600',
					contentType: heroImageFile.type,
					upsert: true,
				});
			if (uploadError) {
				return { message: uploadError.message };
			}
			const { data: publicUrlData } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
			heroImageUrl = publicUrlData.publicUrl;
		}

		const tagArray = tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);

		const { data: recipe, error: recipeError } = await supabase
			.from('recipes')
			.insert({
				author_id: user.id,
				title,
				description,
				servings,
				prep_minutes: prepMinutes,
				cook_minutes: cookMinutes,
				tags: tagArray,
				hero_image_url: heroImageUrl,
				is_published: true,
				published_at: new Date().toISOString(),
				difficulty: difficultyRaw,
			})
			.select()
			.single();

		if (recipeError || !recipe) {
			return { message: recipeError?.message ?? 'Failed to create recipe.' };
		}

	const ingredientRows = ingredientValues.map((line, index) => ({
				recipe_id: recipe.id,
				position: index,
				name: line,
			}));

		if (ingredientRows.length > 0) {
			const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
				ingredientRows.map((row) => {
					const match = row.name.match(/^([0-9/.\s]+)\s+(.*)$/);
					if (!match) {
						return {
							recipe_id: row.recipe_id,
							position: row.position,
							name: row.name,
						};
					}
					const [_, quantity, name] = match;
					return {
						recipe_id: row.recipe_id,
						position: row.position,
						quantity: quantity.trim(),
						name: name.trim(),
					};
				})
			);
			if (ingredientsError) {
				return { message: ingredientsError.message };
			}
		}

	const stepRows = stepValues.map((instruction, index) => ({
				recipe_id: recipe.id,
				position: index,
				instruction,
			}));

		if (stepRows.length > 0) {
			const { error: stepsError } = await supabase.from('recipe_steps').insert(stepRows);
			if (stepsError) {
				return { message: stepsError.message };
			}
		}

		revalidatePath('/');
		return { message: 'Recipe published! Redirecting…', redirectTo: '/' };
	} catch (error) {
		return {
			message: error instanceof Error ? error.message : 'Unexpected error creating recipe.',
		};
	}
}


