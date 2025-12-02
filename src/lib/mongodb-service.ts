/**
 * MongoDB Data Service
 * 
 * Replaces Supabase queries with MongoDB operations
 */

import connectDB from './mongodb';
import { User, IUser } from './models/User';
import { Recipe, IRecipe } from './models/Recipe';
import { RecipeSave } from './models/RecipeSave';
import { Types } from 'mongoose';

// Types matching the existing data service interface
export type RecipeRow = {
  id: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  published_at: string | null;
  difficulty: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  recipe_saves: { count: number | null }[] | null;
};

export type RecipeDetailRow = {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  difficulty: string | null;
  published_at: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  recipe_ingredients: {
    position: number;
    quantity: string | null;
    unit: string | null;
    name: string;
    note: string | null;
  }[];
  recipe_steps: {
    position: number;
    instruction: string;
  }[];
  recipe_saves: { count: number | null }[] | null;
};

// Helper to convert MongoDB recipe to RecipeRow
const recipeToRow = async (recipe: IRecipe & { _id: Types.ObjectId }): Promise<RecipeRow> => {
  await connectDB();
  
  const author = await User.findById(recipe.author_id).lean();
  const saveCount = await RecipeSave.countDocuments({ recipe_id: recipe._id });

  return {
    id: recipe._id.toString(),
    title: recipe.title,
    description: recipe.description ?? null,
    hero_image_url: recipe.hero_image_url ?? null,
    servings: recipe.servings ?? null,
    prep_minutes: recipe.prep_minutes ?? null,
    cook_minutes: recipe.cook_minutes ?? null,
    tags: recipe.tags ?? null,
    published_at: recipe.published_at?.toISOString() ?? null,
    difficulty: recipe.difficulty ?? null,
    profiles: author
      ? {
          full_name: author.full_name ?? null,
          username: author.username ?? null,
          avatar_url: author.avatar_url ?? null,
        }
      : null,
    recipe_saves: [{ count: saveCount }],
  };
};

// Helper to convert MongoDB recipe to RecipeDetailRow
const recipeToDetailRow = async (recipe: IRecipe & { _id: Types.ObjectId }): Promise<RecipeDetailRow> => {
  await connectDB();
  
  const author = await User.findById(recipe.author_id).lean();
  const saveCount = await RecipeSave.countDocuments({ recipe_id: recipe._id });

  return {
    id: recipe._id.toString(),
    author_id: recipe.author_id.toString(),
    title: recipe.title,
    description: recipe.description ?? null,
    hero_image_url: recipe.hero_image_url ?? null,
    servings: recipe.servings ?? null,
    prep_minutes: recipe.prep_minutes ?? null,
    cook_minutes: recipe.cook_minutes ?? null,
    tags: recipe.tags ?? null,
    difficulty: recipe.difficulty ?? null,
    published_at: recipe.published_at?.toISOString() ?? null,
    profiles: author
      ? {
          full_name: author.full_name ?? null,
          username: author.username ?? null,
          avatar_url: author.avatar_url ?? null,
        }
      : null,
    recipe_ingredients: (recipe.recipe_ingredients ?? []).map((ing) => ({
      position: ing.position,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      name: ing.name,
      note: ing.note ?? null,
    })),
    recipe_steps: (recipe.recipe_steps ?? []).map((step) => ({
      position: step.position,
      instruction: step.instruction,
    })),
    recipe_saves: [{ count: saveCount }],
  };
};

/**
 * Fetch published recipes (for home page)
 */
export const fetchPublishedRecipes = async (
  _supabase: null,
  options?: {
    orderBy?: 'published_at';
    orderDirection?: 'asc' | 'desc';
    limit?: number;
  }
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  try {
    await connectDB();

    let query = Recipe.find({ is_published: true });

    if (options?.orderBy === 'published_at') {
      const sortOrder = options.orderDirection === 'asc' ? 1 : -1;
      query = query.sort({ published_at: sortOrder });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const recipes = await query.lean().exec();
    const rows = await Promise.all(recipes.map((r) => recipeToRow(r as IRecipe & { _id: Types.ObjectId })));

    return { data: rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Fetch recipe by ID (for detail page)
 */
export const fetchRecipeById = async (
  _supabase: null,
  recipeId: string | number
): Promise<{ data: RecipeDetailRow | null; error: Error | null }> => {
  try {
    await connectDB();

    const id = typeof recipeId === 'string' ? recipeId : recipeId.toString();
    if (!Types.ObjectId.isValid(id)) {
      return { data: null, error: new Error('Invalid recipe ID') };
    }

    const recipe = await Recipe.findOne({ _id: id, is_published: true }).lean().exec();

    if (!recipe) {
      return { data: null, error: new Error('Recipe not found') };
    }

    const detailRow = await recipeToDetailRow(recipe as IRecipe & { _id: Types.ObjectId });
    return { data: detailRow, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Search recipes
 */
export const searchRecipesData = async (
  _supabase: null,
  query: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  try {
    await connectDB();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return fetchPublishedRecipes(null, { orderBy: 'published_at', orderDirection: 'desc', limit: 50 });
    }

    // Search in title, description, tags, and ingredients
    const recipes = await Recipe.find({
      is_published: true,
      $or: [
        { title: { $regex: trimmedQuery, $options: 'i' } },
        { description: { $regex: trimmedQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(trimmedQuery, 'i')] } },
        { difficulty: { $regex: trimmedQuery, $options: 'i' } },
        { 'recipe_ingredients.name': { $regex: trimmedQuery, $options: 'i' } },
      ],
    })
      .sort({ published_at: -1 })
      .limit(50)
      .lean()
      .exec();

    const rows = await Promise.all(recipes.map((r) => recipeToRow(r as IRecipe & { _id: Types.ObjectId })));
    return { data: rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Fetch recipes by author
 */
export const fetchRecipesByAuthor = async (
  _supabase: null,
  authorId: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(authorId)) {
      return { data: null, error: new Error('Invalid author ID') };
    }

    const recipes = await Recipe.find({ author_id: authorId })
      .sort({ created_at: -1 })
      .lean()
      .exec();

    const rows = await Promise.all(recipes.map((r) => recipeToRow(r as IRecipe & { _id: Types.ObjectId })));
    return { data: rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Fetch saved recipes for user
 */
export const fetchSavedRecipes = async (
  _supabase: null,
  userId: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return { data: null, error: new Error('Invalid user ID') };
    }

    const saves = await RecipeSave.find({ user_id: userId }).lean().exec();
    const recipeIds = saves.map((save) => save.recipe_id);

    if (recipeIds.length === 0) {
      return { data: [], error: null };
    }

    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      is_published: true,
    })
      .lean()
      .exec();

    const rows = await Promise.all(recipes.map((r) => recipeToRow(r as IRecipe & { _id: Types.ObjectId })));
    return { data: rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Check if recipe is saved by user
 */
export const checkRecipeSaved = async (
  _supabase: null,
  recipeId: string | number,
  userId: string
): Promise<{ data: boolean; error: Error | null }> => {
  try {
    await connectDB();

    const id = typeof recipeId === 'string' ? recipeId : recipeId.toString();
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      return { data: false, error: null };
    }

    const save = await RecipeSave.findOne({ user_id: userId, recipe_id: id }).lean().exec();
    return { data: Boolean(save), error: null };
  } catch (error) {
    return { data: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Get saved recipe IDs for user
 */
export const getSavedRecipeIds = async (
  _supabase: null,
  userId: string
): Promise<{ data: number[]; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return { data: [], error: null };
    }

    const saves = await RecipeSave.find({ user_id: userId }).lean().exec();
    const ids = saves.map((save) => {
      const id = save.recipe_id.toString();
      // Try to parse as number for compatibility, fallback to string hash
      const num = parseInt(id, 16);
      return isNaN(num) ? 0 : num;
    });

    return { data: ids, error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

