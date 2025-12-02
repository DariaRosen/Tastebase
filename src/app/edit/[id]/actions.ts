'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';
import { Types } from 'mongoose';

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

const allowedDifficulties = ['Easy', 'Intermediate', 'Advanced'] as const;

export async function updateRecipeAction(
  recipeId: string,
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
  const heroImageUrl = formData.get('heroImageUrl')?.toString() || previousHeroImageUrl || null;
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
  if (ingredientValues.length === 0) errors.ingredients = 'Add at least one ingredient.';
  if (stepValues.length === 0) errors.steps = 'Add at least one step.';
  if (!allowedDifficulties.includes(difficultyRaw as typeof allowedDifficulties[number])) {
    errors.difficulty = 'Select a difficulty level.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: 'Please fix the highlighted fields.' };
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return { message: 'You must be signed in to update a recipe.' };
    }

    if (!Types.ObjectId.isValid(recipeId)) {
      return { message: 'Invalid recipe ID.' };
    }

    await connectDB();

    const existingRecipe = await Recipe.findOne({ _id: recipeId }).lean().exec();

    if (!existingRecipe || existingRecipe.author_id.toString() !== user.id) {
      return { message: 'You do not have permission to edit this recipe.' };
    }

    // Parse ingredients
    const ingredients = ingredientValues.map((ingredientStr, index) => {
      const parts = ingredientStr.split(/\s+/);
      let quantity: string | null = null;
      let unit: string | null = null;
      let name = ingredientStr;
      let note: string | null = null;

      // Try to parse quantity and unit from the beginning
      if (parts.length >= 2) {
        const firstPart = parts[0];
        const secondPart = parts[1];

        // Check if first part is a number
        if (/^\d+([./]\d+)?$/.test(firstPart)) {
          quantity = firstPart;
          // Check if second part looks like a unit
          if (/^(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves)$/i.test(secondPart)) {
            unit = secondPart;
            name = parts.slice(2).join(' ');
          } else {
            name = parts.slice(1).join(' ');
          }
        }
      }

      // Check for note (after dash or comma)
      const noteMatch = name.match(/[–—,]\s*(.+)$/);
      if (noteMatch) {
        note = noteMatch[1].trim();
        name = name.substring(0, noteMatch.index).trim();
      }

      return {
        position: index + 1,
        quantity: quantity || null,
        unit: unit || null,
        name: name.trim() || ingredientStr,
        note: note || null,
      };
    });

    // Parse steps
    const steps = stepValues.map((stepStr, index) => ({
      position: index + 1,
      instruction: stepStr,
    }));

    // Parse tags
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Update recipe
    await Recipe.findByIdAndUpdate(recipeId, {
      $set: {
        title,
        description: description || null,
        servings: servings || null,
        prep_minutes: prepMinutes || null,
        cook_minutes: cookMinutes || null,
        tags: tags.length > 0 ? tags : null,
        hero_image_url: heroImageUrl,
        difficulty: difficultyRaw as 'Easy' | 'Intermediate' | 'Advanced',
        recipe_ingredients: ingredients,
        recipe_steps: steps,
      },
    });

    revalidatePath('/');
    revalidatePath(`/recipe/${recipeId}`);
    revalidatePath('/my-recipes');
    return { redirectTo: `/recipe/${recipeId}` };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unexpected error updating recipe.',
    };
  }
}
