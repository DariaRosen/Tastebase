/**
 * Data Service Layer
 * 
 * Uses MongoDB for all data operations.
 */

import connectDB from './mongodb';
import { User } from './models/User';
import { Recipe } from './models/Recipe';
import { RecipeSave } from './models/RecipeSave';
import { Types } from 'mongoose';

// Types matching the expected response structures
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
  profiles:
    | {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
      }
    | null;
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
  profiles:
    | {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
      }
    | null;
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

// Helper to convert MongoDB ObjectId to string
const objectIdToString = (id: Types.ObjectId | string): string => {
  if (typeof id === 'string') {
    return id;
  }
  return id.toString();
};

// Helper to convert MongoDB ObjectId to number (for compatibility with existing code)
const objectIdToNumber = (id: Types.ObjectId | string): string => {
  return objectIdToString(id);
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

    const query = Recipe.find({ is_published: true });

    if (options?.orderBy === 'published_at') {
      query.sort({ published_at: options.orderDirection === 'asc' ? 1 : -1 });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    let recipes: any[];
    try {
      recipes = await query
        .populate({
          path: 'author_id',
          select: 'full_name username avatar_url',
          model: 'User',
        })
        .lean()
        .exec();
    } catch (queryError: any) {
      console.error('[fetchPublishedRecipes] Query error:', queryError);
      console.error('[fetchPublishedRecipes] Query error name:', queryError?.name);
      console.error('[fetchPublishedRecipes] Query error message:', queryError?.message);
      throw queryError;
    }

    if (!recipes || recipes.length === 0) {
      console.log('[fetchPublishedRecipes] No recipes found');
      return { data: [], error: null };
    }

    // Get save counts for all recipes
    const recipeIds = recipes.map((r) => r._id);
    let saveCounts: any[] = [];
    if (recipeIds.length > 0) {
      try {
        saveCounts = await RecipeSave.aggregate([
          { $match: { recipe_id: { $in: recipeIds } } },
          { $group: { _id: '$recipe_id', count: { $sum: 1 } } },
        ]);
      } catch (aggError) {
        console.error('[fetchPublishedRecipes] Save count aggregation error:', aggError);
        // Continue without save counts if aggregation fails
      }
    }

    const saveCountMap = new Map(
      saveCounts.map((item) => [item._id.toString(), item.count])
    );

    const data: RecipeRow[] = recipes.map((recipe) => {
      const author = recipe.author_id as any;
      const saveCount = saveCountMap.get(recipe._id.toString()) || 0;

      return {
        id: objectIdToNumber(recipe._id),
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
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};

/**
 * Fetch recipe by ID (for detail page)
 */
export const fetchRecipeById = async (
  _supabase: null,
  recipeId: string
): Promise<{ data: RecipeDetailRow | null; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(recipeId)) {
      return { data: null, error: new Error('Invalid recipe ID') };
    }

    const recipe = await Recipe.findOne({
      _id: new Types.ObjectId(recipeId),
      is_published: true,
    })
      .populate('author_id', 'full_name username avatar_url')
      .lean()
      .exec();

    if (!recipe) {
      return { data: null, error: new Error('Recipe not found') };
    }

    const author = Array.isArray(recipe.author_id)
      ? (recipe.author_id[0] as any)
      : (recipe.author_id as any);

    // Get save count
    const saveCount = await RecipeSave.countDocuments({
      recipe_id: recipe._id,
    });

    const data: RecipeDetailRow = {
      id: objectIdToString(recipe._id),
      author_id: author?._id?.toString() ?? recipe.author_id?.toString() ?? null,
      title: recipe.title,
      description: recipe.description ?? null,
      hero_image_url: recipe.hero_image_url ?? null,
      servings: recipe.servings ?? null,
      prep_minutes: recipe.prep_minutes ?? null,
      cook_minutes: recipe.cook_minutes ?? null,
      tags: recipe.tags ?? null,
      difficulty: recipe.difficulty ?? null,
      published_at: recipe.published_at?.toISOString() ?? null,
      profiles: author && typeof author === 'object'
        ? {
            full_name: author.full_name ?? null,
            username: author.username ?? null,
            avatar_url: author.avatar_url ?? null,
          }
        : null,
      recipe_ingredients: (recipe.recipe_ingredients || []).map((ing: any) => ({
        position: ing.position,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        name: ing.name,
        note: ing.note ?? null,
      })),
      recipe_steps: (recipe.recipe_steps || []).map((step: any) => ({
        position: step.position,
        instruction: step.instruction,
      })),
      recipe_saves: [{ count: saveCount }],
    };

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
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
      return fetchPublishedRecipes(null, { limit: 50 });
    }

    const recipes = await Recipe.find({
      is_published: true,
      $or: [
        { title: { $regex: trimmedQuery, $options: 'i' } },
        { description: { $regex: trimmedQuery, $options: 'i' } },
        { difficulty: { $regex: trimmedQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(trimmedQuery, 'i')] } },
        { 'recipe_ingredients.name': { $regex: trimmedQuery, $options: 'i' } },
      ],
    })
      .populate('author_id', 'full_name username avatar_url')
      .sort({ published_at: -1 })
      .limit(50)
      .lean()
      .exec();

    const recipeIds = recipes.map((r) => r._id);
    const saveCounts = await RecipeSave.aggregate([
      { $match: { recipe_id: { $in: recipeIds } } },
      { $group: { _id: '$recipe_id', count: { $sum: 1 } } },
    ]);

    const saveCountMap = new Map(
      saveCounts.map((item) => [item._id.toString(), item.count])
    );

    const data: RecipeRow[] = recipes.map((recipe) => {
      const author = Array.isArray(recipe.author_id)
        ? (recipe.author_id[0] as any)
        : (recipe.author_id as any);
      const saveCount = saveCountMap.get(recipe._id.toString()) || 0;

      return {
        id: objectIdToString(recipe._id),
        title: recipe.title,
        description: recipe.description ?? null,
        hero_image_url: recipe.hero_image_url ?? null,
        servings: recipe.servings ?? null,
        prep_minutes: recipe.prep_minutes ?? null,
        cook_minutes: recipe.cook_minutes ?? null,
        tags: recipe.tags ?? null,
        published_at: recipe.published_at?.toISOString() ?? null,
        difficulty: recipe.difficulty ?? null,
        profiles: author && typeof author === 'object'
          ? {
              full_name: author.full_name ?? null,
              username: author.username ?? null,
              avatar_url: author.avatar_url ?? null,
            }
          : null,
        recipe_saves: [{ count: saveCount }],
      };
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
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

    const recipes = await Recipe.find({
      author_id: new Types.ObjectId(authorId),
      is_published: true,
    })
      .populate('author_id', 'full_name username avatar_url')
      .sort({ created_at: -1 })
      .lean()
      .exec();

    const recipeIds = recipes.map((r) => r._id);
    const saveCounts = await RecipeSave.aggregate([
      { $match: { recipe_id: { $in: recipeIds } } },
      { $group: { _id: '$recipe_id', count: { $sum: 1 } } },
    ]);

    const saveCountMap = new Map(
      saveCounts.map((item) => [item._id.toString(), item.count])
    );

    const data: RecipeRow[] = recipes.map((recipe) => {
      const author = Array.isArray(recipe.author_id)
        ? (recipe.author_id[0] as any)
        : (recipe.author_id as any);
      const saveCount = saveCountMap.get(recipe._id.toString()) || 0;

      return {
        id: objectIdToString(recipe._id),
        title: recipe.title,
        description: recipe.description ?? null,
        hero_image_url: recipe.hero_image_url ?? null,
        servings: recipe.servings ?? null,
        prep_minutes: recipe.prep_minutes ?? null,
        cook_minutes: recipe.cook_minutes ?? null,
        tags: recipe.tags ?? null,
        published_at: recipe.published_at?.toISOString() ?? null,
        difficulty: recipe.difficulty ?? null,
        profiles: author && typeof author === 'object'
          ? {
              full_name: author.full_name ?? null,
              username: author.username ?? null,
              avatar_url: author.avatar_url ?? null,
            }
          : null,
        recipe_saves: [{ count: saveCount }],
      };
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
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

    const saves = await RecipeSave.find({
      user_id: new Types.ObjectId(userId),
    })
      .populate({
        path: 'recipe_id',
        match: { is_published: true },
        populate: { path: 'author_id', select: 'full_name username avatar_url' },
      })
      .lean()
      .exec();

    const recipes = saves
      .map((save) => save.recipe_id)
      .filter((r) => r !== null && typeof r === 'object') as any[];

    const recipeIds = recipes.map((r) => r._id);
    const saveCounts = await RecipeSave.aggregate([
      { $match: { recipe_id: { $in: recipeIds } } },
      { $group: { _id: '$recipe_id', count: { $sum: 1 } } },
    ]);

    const saveCountMap = new Map(
      saveCounts.map((item) => [item._id.toString(), item.count])
    );

    const data: RecipeRow[] = recipes.map((recipe) => {
      const author = Array.isArray(recipe.author_id)
        ? (recipe.author_id[0] as any)
        : (recipe.author_id as any);
      const saveCount = saveCountMap.get(recipe._id.toString()) || 0;

      return {
        id: objectIdToString(recipe._id),
        title: recipe.title,
        description: recipe.description ?? null,
        hero_image_url: recipe.hero_image_url ?? null,
        servings: recipe.servings ?? null,
        prep_minutes: recipe.prep_minutes ?? null,
        cook_minutes: recipe.cook_minutes ?? null,
        tags: recipe.tags ?? null,
        published_at: recipe.published_at?.toISOString() ?? null,
        difficulty: recipe.difficulty ?? null,
        profiles: author && typeof author === 'object'
          ? {
              full_name: author.full_name ?? null,
              username: author.username ?? null,
              avatar_url: author.avatar_url ?? null,
            }
          : null,
        recipe_saves: [{ count: saveCount }],
      };
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};

/**
 * Check if recipe is saved by user
 */
export const checkRecipeSaved = async (
  _supabase: null,
  recipeId: string,
  userId: string
): Promise<{ data: boolean; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(recipeId) || !Types.ObjectId.isValid(userId)) {
      return { data: false, error: null };
    }

    const saved = await RecipeSave.findOne({
      user_id: new Types.ObjectId(userId),
      recipe_id: new Types.ObjectId(recipeId),
    });

    return { data: !!saved, error: null };
  } catch (error) {
    return {
      data: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};

/**
 * Get saved recipe IDs for user
 */
export const getSavedRecipeIds = async (
  _supabase: null,
  userId: string
): Promise<{ data: string[]; error: Error | null }> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return { data: [], error: null };
    }

    const saves = await RecipeSave.find({
      user_id: new Types.ObjectId(userId),
    })
      .populate({
        path: 'recipe_id',
        match: { is_published: true },
      })
      .lean()
      .exec();

    const data = saves
      .map((save) => {
        const recipe = save.recipe_id as any;
        if (recipe && typeof recipe === 'object' && recipe._id) {
          return objectIdToString(recipe._id);
        }
        return null;
      })
      .filter((id): id is string => id !== null);

    return { data, error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};
