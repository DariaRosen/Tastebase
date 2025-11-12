'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Buffer } from 'buffer';
import { createServerSupabase } from '@/lib/supabaseServer';

export interface UpdateRecipeState {
	errors?: Record<string, string>;
	message?: string;
	redirectTo?: string;
}

const parseNumber = (value: FormDataEntryValue | null) => {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export async function updateRecipeAction(
	recipeId: number,
	previousHeroImageUrl: string | null,
	_prevState: UpdateRecipeState,
	formData: FormData
): Promise<UpdateRecipeState> {
	const title = formData.get('title')?.toString().trim() ?? '';
	const description = formData.get('description')?.toString().trim() ?? '';
	const servings = parseNumber(formData.get('servings'));
	const prepMinutes = parseNumber(formData.get('prepMinutes'));
	const cookMinutes = parseNumber(formData.get('cookMinutes'));
	const tagsInput = formData.get('tags')?.toString() ?? '';
	const heroImageFile = formData.get('heroImage');
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
	if (ingredientValues.length === 0) errors.ingredients = 'Add at least one ingredient.';
	if (stepValues.length === 0) errors.steps = 'Add at least one step.';

	if (Object.keys(errors).length > 0) {
		return { errors, message: 'Please fix the highlighted fields.' };
	}

	try {
		const supabase = await createServerSupabase({ shouldSetCookies: true });
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { message: 'You must be signed in to update a recipe.' };
		}

		const { data: existingRecipe } = await supabase
			.from('recipes')
			.select('author_id, hero_image_url')
			.eq('id', recipeId)
			.maybeSingle();

		if (!existingRecipe || existingRecipe.author_id !== user.id) {
			return { message: 'You do not have permission to edit this recipe.' };
		}

		let heroImageUrl = previousHeroImageUrl ?? existingRecipe.hero_image_url ?? null;
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

		const { error: recipeError } = await supabase
			.from('recipes')
			.update({
				title,
				description,
				servings,
				prep_minutes: prepMinutes,
				cook_minutes: cookMinutes,
				tags: tagArray,
				hero_image_url: heroImageUrl,
			})
			.eq('id', recipeId);

		if (recipeError) {
			return { message: recipeError.message ?? 'Failed to update recipe.' };
		}

		await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
		await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);

		if (ingredientValues.length > 0) {
			const ingredientRows = ingredientValues.map((line, index) => {
				const match = line.match(/^([0-9/.\s]+)\s+(.*)$/);
				if (!match) {
					return {
						recipe_id: recipeId,
						position: index,
						name: line,
					};
				}
				const [_, quantity, name] = match;
				return {
					recipe_id: recipeId,
					position: index,
					quantity: quantity.trim(),
					name: name.trim(),
				};
			});

			const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(ingredientRows);
			if (ingredientsError) {
				return { message: ingredientsError.message };
			}
		}

		if (stepValues.length > 0) {
			const stepRows = stepValues.map((instruction, index) => ({
				recipe_id: recipeId,
				position: index,
				instruction,
			}));

			const { error: stepsError } = await supabase.from('recipe_steps').insert(stepRows);
			if (stepsError) {
				return { message: stepsError.message };
			}
		}

		revalidatePath('/');
		revalidatePath(`/recipe/${recipeId}`);
		return { redirectTo: `/recipe/${recipeId}` };
	} catch (error) {
		return {
			message: error instanceof Error ? error.message : 'Unexpected error updating recipe.',
		};
	}
}


