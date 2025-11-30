/**
 * Demo Authentication Service
 * 
 * Provides authentication functionality when USE_SUPABASE is false.
 * Uses localStorage to persist demo user sessions.
 */

export interface DemoUser {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

const DEMO_AUTH_KEY = 'tastebase-demo-auth';
const DEMO_USERS_KEY = 'tastebase-demo-users';

// Get demo users from localStorage
const getDemoUsers = (): DemoUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save demo users to localStorage
const saveDemoUsers = (users: DemoUser[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore localStorage errors
  }
};

// Get current demo session
export const getDemoSession = (): DemoUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(DEMO_AUTH_KEY);
    if (!stored) return null;
    const userId = JSON.parse(stored);
    const users = getDemoUsers();
    return users.find((u) => u.id === userId) || null;
  } catch {
    return null;
  }
};

// Sign up a new demo user
export const signUpDemoUser = async (
  email: string,
  fullName?: string
): Promise<{ user: DemoUser | null; error: Error | null }> => {
  try {
    const users = getDemoUsers();
    
    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return {
        user: null,
        error: new Error('User with this email already exists. Try logging in instead.'),
      };
    }

    // Generate username from email or name
    const sanitizeUsername = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);

    const emailBase = email.split('@')[0] || '';
    const usernameBase = fullName ? sanitizeUsername(fullName) : sanitizeUsername(emailBase);
    let username = usernameBase || `cook-${Math.random().toString(36).slice(2, 8)}`;
    
    // Ensure username is unique
    let suffix = 1;
    while (users.some((u) => u.username === username)) {
      const suffixStr = `-${suffix}`;
      const trimmed = username.slice(0, Math.max(0, 32 - suffixStr.length));
      username = `${trimmed}${suffixStr}`;
      suffix += 1;
    }

    // Create new user
    const newUser: DemoUser = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      email: email.toLowerCase(),
      full_name: fullName?.trim() || null,
      username,
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveDemoUsers(users);

    // Set as current session
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(newUser.id));
    }

    return { user: newUser, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to create demo user'),
    };
  }
};

// Sign in a demo user
export const signInDemoUser = async (
  email: string
): Promise<{ user: DemoUser | null; error: Error | null }> => {
  try {
    const users = getDemoUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        user: null,
        error: new Error('No user found with this email. Try signing up instead.'),
      };
    }

    // Set as current session
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(user.id));
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to sign in'),
    };
  }
};

// Sign out demo user
export const signOutDemoUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_AUTH_KEY);
};

// Update demo user profile
export const updateDemoUser = (
  userId: string,
  updates: Partial<Pick<DemoUser, 'full_name' | 'username' | 'avatar_url' | 'bio'>>
): DemoUser | null => {
  try {
    const users = getDemoUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
    };

    saveDemoUsers(users);

    // Update session if it's the current user
    const currentSession = getDemoSession();
    if (currentSession?.id === userId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(userId));
      }
    }

    return users[userIndex];
  } catch {
    return null;
  }
};

// Recipe saves (wishlist) management
const DEMO_RECIPE_SAVES_KEY = 'tastebase-demo-recipe-saves';

interface DemoRecipeSave {
  id: string;
  user_id: string;
  recipe_id: number;
  created_at: string;
}

const getDemoRecipeSaves = (): DemoRecipeSave[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_RECIPE_SAVES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveDemoRecipeSaves = (saves: DemoRecipeSave[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_RECIPE_SAVES_KEY, JSON.stringify(saves));
  } catch {
    // Ignore localStorage errors
  }
};

// Save a recipe to wishlist
export const saveRecipeToWishlist = (userId: string, recipeId: number): { success: boolean; error: Error | null } => {
  try {
    const saves = getDemoRecipeSaves();
    
    // Check if already saved
    const existing = saves.find((s) => s.user_id === userId && s.recipe_id === recipeId);
    if (existing) {
      return { success: true, error: null };
    }

    const newSave: DemoRecipeSave = {
      id: `save-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      user_id: userId,
      recipe_id: recipeId,
      created_at: new Date().toISOString(),
    };

    saves.push(newSave);
    saveDemoRecipeSaves(saves);
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to save recipe'),
    };
  }
};

// Remove a recipe from wishlist
export const removeRecipeFromWishlist = (userId: string, recipeId: number): { success: boolean; error: Error | null } => {
  try {
    const saves = getDemoRecipeSaves();
    const filtered = saves.filter((s) => !(s.user_id === userId && s.recipe_id === recipeId));
    saveDemoRecipeSaves(filtered);
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to remove recipe'),
    };
  }
};

// Check if recipe is saved by user
export const isRecipeSavedByDemoUser = (userId: string, recipeId: number): boolean => {
  const saves = getDemoRecipeSaves();
  return saves.some((s) => s.user_id === userId && s.recipe_id === recipeId);
};

// Get all saved recipe IDs for a user
export const getSavedRecipeIdsForDemoUser = (userId: string): number[] => {
  const saves = getDemoRecipeSaves();
  return saves.filter((s) => s.user_id === userId).map((s) => s.recipe_id);
};

// Get save count for a recipe
export const getRecipeSaveCount = (recipeId: number): number => {
  const saves = getDemoRecipeSaves();
  return saves.filter((s) => s.recipe_id === recipeId).length;
};

// Recipe management for demo mode
const DEMO_RECIPES_KEY = 'tastebase-demo-recipes';

export interface DemoRecipeData {
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
  is_published: boolean;
  created_at: string;
  recipe_ingredients: Array<{
    position: number;
    quantity: string | null;
    name: string;
  }>;
  recipe_steps: Array<{
    position: number;
    instruction: string;
  }>;
}

const getDemoRecipes = (): DemoRecipeData[] => {
  if (typeof window === 'undefined') {
    // On server, return empty array - recipes should be loaded from demo-data.ts
    return [];
  }
  try {
    const stored = localStorage.getItem(DEMO_RECIPES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveDemoRecipes = (recipes: DemoRecipeData[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_RECIPES_KEY, JSON.stringify(recipes));
  } catch {
    // Ignore localStorage errors
  }
};

// Create a new recipe in demo mode
export const createDemoRecipe = (recipe: Omit<DemoRecipeData, 'id' | 'created_at' | 'published_at'>): DemoRecipeData | null => {
  try {
    const recipes = getDemoRecipes();
    
    // Get the highest ID from existing recipes (including demo-data.ts)
    const existingIds = recipes.map((r) => r.id);
    // Start from 100 to avoid conflicts with demo-data.ts recipes (1-6)
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 100;
    const newId = maxId + 1;

    const newRecipe: DemoRecipeData = {
      ...recipe,
      id: newId,
      created_at: new Date().toISOString(),
      published_at: recipe.is_published ? new Date().toISOString() : new Date().toISOString(),
    };

    recipes.push(newRecipe);
    saveDemoRecipes(recipes);
    return newRecipe;
  } catch {
    return null;
  }
};

// Update a recipe in demo mode
export const updateDemoRecipe = (recipeId: number, updates: Partial<Omit<DemoRecipeData, 'id' | 'author_id' | 'created_at'>>): DemoRecipeData | null => {
  try {
    const recipes = getDemoRecipes();
    const recipeIndex = recipes.findIndex((r) => r.id === recipeId);
    
    if (recipeIndex === -1) return null;

    recipes[recipeIndex] = {
      ...recipes[recipeIndex],
      ...updates,
    };

    saveDemoRecipes(recipes);
    return recipes[recipeIndex];
  } catch {
    return null;
  }
};

// Get a recipe by ID (checks both localStorage and demo-data.ts)
export const getDemoRecipeById = (id: number): DemoRecipeData | null => {
  // First check localStorage
  const recipes = getDemoRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (recipe) return recipe;

  // Fallback to demo-data.ts if available
  if (typeof window !== 'undefined') {
    try {
      const { getRecipeById } = require('./demo-data');
      return getRecipeById(id) as DemoRecipeData | null;
    } catch {
      return null;
    }
  }
  return null;
};

// Get all published recipes (combines localStorage and demo-data.ts)
export const getAllPublishedDemoRecipes = (): DemoRecipeData[] => {
  const localRecipes = getDemoRecipes().filter((r) => r.is_published);
  
  // Also include recipes from demo-data.ts
  if (typeof window !== 'undefined') {
    try {
      const { getPublishedRecipes } = require('./demo-data');
      const demoDataRecipes = getPublishedRecipes();
      // Combine and sort by published_at
      const all = [...demoDataRecipes, ...localRecipes];
      return all.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } catch {
      return localRecipes;
    }
  }
  return localRecipes;
};

