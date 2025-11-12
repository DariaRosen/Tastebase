'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabaseServer';

export interface DeleteRecipeResult {
  success?: boolean;
  error?: string;
}

export async function deleteRecipeAction(recipeId: number): Promise<DeleteRecipeResult> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be signed in to delete a recipe.' };
    }

    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', recipeId)
      .maybeSingle();

    if (fetchError || !recipe) {
      return { error: 'Recipe not found.' };
    }

    if (recipe.author_id !== user.id) {
      return { error: 'You do not have permission to delete this recipe.' };
    }

    const { error: deleteError } = await supabase.from('recipes').delete().eq('id', recipeId);

    if (deleteError) {
      return { error: deleteError.message ?? 'Failed to delete recipe.' };
    }

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
