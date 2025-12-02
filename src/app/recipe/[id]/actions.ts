'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';
import { RecipeSave } from '@/lib/models/RecipeSave';
import { Types } from 'mongoose';

export interface DeleteRecipeResult {
  success?: boolean;
  error?: string;
}

export async function deleteRecipeAction(recipeId: string): Promise<DeleteRecipeResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'You must be signed in to delete a recipe.' };
    }

    if (!Types.ObjectId.isValid(recipeId)) {
      return { error: 'Invalid recipe ID.' };
    }

    await connectDB();

    const recipe = await Recipe.findOne({ _id: recipeId, author_id: user.id }).lean().exec();

    if (!recipe) {
      return { error: 'Recipe not found or you do not have permission to delete it.' };
    }

    // Delete recipe and associated saves
    await Recipe.deleteOne({ _id: recipeId });
    await RecipeSave.deleteMany({ recipe_id: recipeId });

    revalidatePath('/');
    revalidatePath('/wishlist');
    revalidatePath('/my-recipes');

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete recipe.',
    };
  }
}
