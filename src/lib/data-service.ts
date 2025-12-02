/**
 * Data Service Layer
 * 
 * Abstracts data fetching to support both Supabase and local demo data.
 * Checks USE_SUPABASE config and returns appropriate data source.
 */

import { USE_SUPABASE } from './data-config';
import {
  getPublishedRecipes,
  getRecipeById,
  getProfileById,
  searchRecipes,
  getRecipesByAuthor,
  getSavedRecipesForUser,
  isRecipeSavedByUser,
  getRecipeSaveCount,
  type DemoRecipe,
  type DemoProfile,
} from './demo-data';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types matching Supabase response structures
export type RecipeRow = {
  id: number;
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
  id: number;
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

// Minimal shared recipe shape used for demo data (both static demo-data and dynamic demo-auth)
interface BaseDemoRecipeForList {
  id: number;
  author_id: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  servings: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  difficulty: string | null;
  published_at: string;
}

// Convert demo recipe to Supabase-like format
export const convertDemoRecipeToRow = (recipe: BaseDemoRecipeForList): RecipeRow => {
  const profile = getProfileById(recipe.author_id);
  // Use demo-auth for save count if available
  let saveCount = 0;
  if (typeof window !== 'undefined') {
    try {
      const { getRecipeSaveCount: getCount } = require('./demo-auth');
      saveCount = getCount(recipe.id);
    } catch {
      saveCount = getRecipeSaveCount(recipe.id);
    }
  } else {
    saveCount = getRecipeSaveCount(recipe.id);
  }

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    hero_image_url: recipe.hero_image_url,
    servings: recipe.servings,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    tags: recipe.tags,
    published_at: recipe.published_at,
    difficulty: recipe.difficulty,
    profiles: profile
      ? {
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
        }
      : null,
    recipe_saves: [{ count: saveCount }],
  };
};

const convertDemoRecipeToDetailRow = (recipe: DemoRecipe): RecipeDetailRow => {
  const profile = getProfileById(recipe.author_id);
  // Use demo-auth for save count if available
  let saveCount = 0;
  if (typeof window !== 'undefined') {
    try {
      const { getRecipeSaveCount: getCount } = require('./demo-auth');
      saveCount = getCount(recipe.id);
    } catch {
      saveCount = getRecipeSaveCount(recipe.id);
    }
  } else {
    saveCount = getRecipeSaveCount(recipe.id);
  }

  return {
    id: recipe.id,
    author_id: recipe.author_id,
    title: recipe.title,
    description: recipe.description,
    hero_image_url: recipe.hero_image_url,
    servings: recipe.servings,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    tags: recipe.tags,
    difficulty: recipe.difficulty,
    published_at: recipe.published_at,
    profiles: profile
      ? {
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
        }
      : null,
    recipe_ingredients: recipe.recipe_ingredients.map((ing) => ({
      position: ing.position,
      quantity: ing.quantity,
      unit: ing.unit,
      name: ing.name,
      note: ing.note,
    })),
    recipe_steps: recipe.recipe_steps.map((step) => ({
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
  supabase: SupabaseClient | null,
  options?: {
    orderBy?: 'published_at';
    orderDirection?: 'asc' | 'desc';
    limit?: number;
  }
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const query = supabase
        .from('recipes')
        .select(
          `
            id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            published_at,
            difficulty,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          `
        )
        .eq('is_published', true)
        .limit(options?.limit ?? 30);

      if (options?.orderBy) {
        query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as RecipeRow[], error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local demo data (static + dynamic)
  let recipes: BaseDemoRecipeForList[];
  if (typeof window !== 'undefined') {
    try {
      const { getAllPublishedDemoRecipes } = require('./demo-auth') as {
        getAllPublishedDemoRecipes: () => BaseDemoRecipeForList[];
      };
      recipes = getAllPublishedDemoRecipes();
    } catch {
      recipes = getPublishedRecipes();
    }
  } else {
    recipes = getPublishedRecipes();
  }
  if (options?.orderBy === 'published_at') {
    recipes = [...recipes].sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return options.orderDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
  if (options?.limit) {
    recipes = recipes.slice(0, options.limit);
  }

  return { data: recipes.map(convertDemoRecipeToRow), error: null };
};

/**
 * Fetch recipe by ID (for detail page)
 */
export const fetchRecipeById = async (
  supabase: SupabaseClient | null,
  recipeId: number
): Promise<{ data: RecipeDetailRow | null; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
            id,
            author_id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            difficulty,
            published_at,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_ingredients:recipe_ingredients (
              position,
              quantity,
              unit,
              name,
              note
            ),
            recipe_steps:recipe_steps (
              position,
              instruction
            ),
            recipe_saves:recipe_saves ( count )
          `
        )
        .eq('id', recipeId)
        .eq('is_published', true)
        .order('position', { foreignTable: 'recipe_ingredients', ascending: true })
        .order('position', { foreignTable: 'recipe_steps', ascending: true })
        .maybeSingle<RecipeDetailRow>();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local demo data
  // First, try dynamic demo recipes (including user-created) when running in the browser.
  if (typeof window !== 'undefined') {
    try {
      // getDemoRecipeById already falls back to static demo-data recipes internally
      const { getDemoRecipeById, getRecipeSaveCount: getDemoSaveCount } = require('./demo-auth') as {
        getDemoRecipeById: (id: number) => DemoRecipe | null;
        getRecipeSaveCount: (id: number) => number;
      };
      const demoRecipe = getDemoRecipeById(recipeId);
      if (demoRecipe) {
        const profile = getProfileById(demoRecipe.author_id);
        const saveCount = getDemoSaveCount(demoRecipe.id);

        const detailRow: RecipeDetailRow = {
          id: demoRecipe.id,
          author_id: demoRecipe.author_id,
          title: demoRecipe.title,
          description: demoRecipe.description,
          hero_image_url: demoRecipe.hero_image_url,
          servings: demoRecipe.servings,
          prep_minutes: demoRecipe.prep_minutes,
          cook_minutes: demoRecipe.cook_minutes,
          tags: demoRecipe.tags,
          difficulty: demoRecipe.difficulty,
          published_at: demoRecipe.published_at,
          profiles: profile
            ? {
                full_name: profile.full_name,
                username: profile.username,
                avatar_url: profile.avatar_url,
              }
            : null,
          recipe_ingredients: demoRecipe.recipe_ingredients.map((ingredient) => ({
            position: ingredient.position,
            quantity: ingredient.quantity,
            // Demo recipes created via demo-auth may not have unit/note – default to null
            // Static demo-data recipes will include these fields.
            // @ts-expect-error - unit and note may not exist on all demo recipe ingredient shapes
            unit: ingredient.unit ?? null,
            // @ts-expect-error - unit and note may not exist on all demo recipe ingredient shapes
            note: ingredient.note ?? null,
            name: ingredient.name,
          })),
          recipe_steps: demoRecipe.recipe_steps.map((step) => ({
            position: step.position,
            instruction: step.instruction,
          })),
          recipe_saves: [{ count: saveCount }],
        };

        return { data: detailRow, error: null };
      }
    } catch {
      // Fall through to static demo data below
    }
  }

  // Fallback to static demo-data recipes only
  const recipe = getRecipeById(recipeId);
  if (!recipe) {
    return { data: null, error: new Error('Recipe not found') };
  }

  return { data: convertDemoRecipeToDetailRow(recipe), error: null };
};

/**
 * Search recipes
 */
export const searchRecipesData = async (
  supabase: SupabaseClient | null,
  query: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const trimmedQuery = query.trim();
      const escapedQuery = trimmedQuery.replace(/[%_\\]/g, (char) => `\\${char}`);
      const likePattern = `%${escapedQuery}%`;
      const baseOrFilters = ['title', 'description', 'difficulty']
        .map((column) => `${column}.ilike.${likePattern}`)
        .join(',');

      const [
        { data: baseData, error: baseError },
        { data: ingredientRows, error: ingredientError },
      ] = await Promise.all([
        supabase
          .from('recipes')
          .select(
            `
              id,
              title,
              description,
              hero_image_url,
              servings,
              prep_minutes,
              cook_minutes,
              tags,
              difficulty,
              published_at,
              recipe_ingredients:recipe_ingredients (
                name
              ),
              profiles:profiles!recipes_author_id_fkey (
                full_name,
                username,
                avatar_url
              ),
              recipe_saves:recipe_saves ( count )
            `
          )
          .eq('is_published', true)
          .or(baseOrFilters)
          .order('published_at', { ascending: false })
          .limit(50),
        supabase
          .from('recipe_ingredients')
          .select('recipe_id')
          .ilike('name', likePattern)
          .limit(200),
      ]);

      if (baseError || ingredientError) {
        return { data: null, error: new Error(baseError?.message ?? ingredientError?.message ?? 'Search failed') };
      }

      const baseRecipes = (baseData ?? []) as RecipeRow[];
      const ingredientRecipeIds = new Set((ingredientRows ?? []).map((row: { recipe_id: number }) => row.recipe_id));

      const { data: ingredientRecipesData, error: ingredientRecipesError } = await supabase
        .from('recipes')
        .select(
          `
            id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            difficulty,
            published_at,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          `
        )
        .eq('is_published', true)
        .in(
          'id',
          Array.from(ingredientRecipeIds).filter((id) => !baseRecipes.some((r) => r.id === id))
        )
        .order('published_at', { ascending: false })
        .limit(50);

      if (ingredientRecipesError) {
        return { data: null, error: new Error(ingredientRecipesError.message) };
      }

      const ingredientRecipes = (ingredientRecipesData ?? []) as RecipeRow[];
      const combinedRecipes = [...baseRecipes, ...ingredientRecipes].sort((first, second) => {
        const firstPublished = first.published_at ?? '';
        const secondPublished = second.published_at ?? '';
        if (firstPublished === secondPublished) {
          return second.id - first.id;
        }
        return secondPublished.localeCompare(firstPublished);
      });

      return { data: combinedRecipes.slice(0, 50), error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local data
  if (typeof window !== 'undefined') {
    try {
      const { getAllPublishedDemoRecipes } = require('./demo-auth') as {
        getAllPublishedDemoRecipes: () => BaseDemoRecipeForList[];
      };
      const allRecipes = getAllPublishedDemoRecipes();
      const lowerQuery = query.toLowerCase().trim();
      const filtered =
        lowerQuery.length === 0
          ? allRecipes
          : allRecipes.filter((recipe) => {
              const matchesTitle = recipe.title.toLowerCase().includes(lowerQuery);
              const matchesDescription = recipe.description?.toLowerCase().includes(lowerQuery) ?? false;
              const matchesDifficulty = recipe.difficulty?.toLowerCase().includes(lowerQuery) ?? false;
              const matchesTag =
                recipe.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ?? false;
              return matchesTitle || matchesDescription || matchesDifficulty || matchesTag;
            });
      return { data: filtered.map(convertDemoRecipeToRow), error: null };
    } catch {
      // Fall back to original static search
    }
  }

  const recipes = searchRecipes(query);
  return { data: recipes.map(convertDemoRecipeToRow), error: null };
};

/**
 * Fetch recipes by author
 */
export const fetchRecipesByAuthor = async (
  supabase: SupabaseClient | null,
  authorId: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
            id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            difficulty,
            published_at,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          `
        )
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as RecipeRow[], error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local data
  if (typeof window !== 'undefined') {
    try {
      const { getAllPublishedDemoRecipes } = require('./demo-auth') as {
        getAllPublishedDemoRecipes: () => BaseDemoRecipeForList[];
      };
      const allRecipes = getAllPublishedDemoRecipes();
      const authored = allRecipes.filter((recipe) => recipe.author_id === authorId);
      return { data: authored.map(convertDemoRecipeToRow), error: null };
    } catch {
      // Fall back to original static implementation
    }
  }

  const recipes = getRecipesByAuthor(authorId);
  return { data: recipes.map(convertDemoRecipeToRow), error: null };
};

/**
 * Fetch saved recipes for user
 */
export const fetchSavedRecipes = async (
  supabase: SupabaseClient | null,
  userId: string
): Promise<{ data: RecipeRow[] | null; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('recipe_saves')
        .select(
          `
          recipe_id,
          recipes (
            id,
            title,
            description,
            hero_image_url,
            servings,
            prep_minutes,
            cook_minutes,
            tags,
            difficulty,
            published_at,
            profiles:profiles!recipes_author_id_fkey (
              full_name,
              username,
              avatar_url
            ),
            recipe_saves:recipe_saves ( count )
          )
        `
        )
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const mapped = ((data ?? []) as Array<{ recipe_id: number; recipes: RecipeRow | null }>)
        .map((row) => row.recipes)
        .filter((recipe): recipe is RecipeRow => Boolean(recipe));

      return { data: mapped, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local data
  if (typeof window !== 'undefined') {
    try {
      const {
        getSavedRecipeIdsForDemoUser,
        getAllPublishedDemoRecipes,
      } = require('./demo-auth') as {
        getSavedRecipeIdsForDemoUser: (userId: string) => number[];
        getAllPublishedDemoRecipes: () => BaseDemoRecipeForList[];
      };
      const savedIds = new Set(getSavedRecipeIdsForDemoUser(userId));
      const allRecipes = getAllPublishedDemoRecipes();
      const savedRecipes = allRecipes.filter((recipe) => savedIds.has(recipe.id));
      return { data: savedRecipes.map(convertDemoRecipeToRow), error: null };
    } catch {
      // Fall back to original static implementation
    }
  }

  const recipes = getSavedRecipesForUser(userId);
  return { data: recipes.map(convertDemoRecipeToRow), error: null };
};

/**
 * Check if recipe is saved by user
 */
export const checkRecipeSaved = async (
  supabase: SupabaseClient | null,
  recipeId: number,
  userId: string
): Promise<{ data: boolean; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('recipe_saves')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: false, error: new Error(error.message) };
      }

      return { data: Boolean(data), error: null };
    } catch (error) {
      return { data: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local data - check demo-auth first
  if (typeof window !== 'undefined') {
    try {
      const { isRecipeSavedByDemoUser } = require('./demo-auth');
      return { data: isRecipeSavedByDemoUser(userId, recipeId), error: null };
    } catch {
      return { data: isRecipeSavedByUser(recipeId, userId), error: null };
    }
  }
  return { data: isRecipeSavedByUser(recipeId, userId), error: null };
};

/**
 * Get saved recipe IDs for user
 */
export const getSavedRecipeIds = async (
  supabase: SupabaseClient | null,
  userId: string
): Promise<{ data: number[]; error: Error | null }> => {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('recipe_saves')
        .select('recipe_id')
        .eq('user_id', userId);

      if (error) {
        return { data: [], error: new Error(error.message) };
      }

      return { data: (data ?? []).map((item: { recipe_id: number }) => item.recipe_id), error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Use local data - get from demo-auth
  if (typeof window !== 'undefined') {
    try {
      const { getSavedRecipeIdsForDemoUser } = require('./demo-auth');
      return { data: getSavedRecipeIdsForDemoUser(userId), error: null };
    } catch {
      return { data: [], error: null };
    }
  }
  return { data: [], error: null };
};

