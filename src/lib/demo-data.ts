/**
 * Demo Data for Local Development
 * 
 * This file contains sample data that mimics the Supabase database structure.
 * Used when USE_SUPABASE is set to false in data-config.ts
 */

export interface DemoProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface DemoRecipeIngredient {
  position: number;
  quantity: string | null;
  unit: string | null;
  name: string;
  note: string | null;
}

export interface DemoRecipeStep {
  position: number;
  instruction: string;
}

export interface DemoRecipe {
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
  recipe_ingredients: DemoRecipeIngredient[];
  recipe_steps: DemoRecipeStep[];
}

export interface DemoRecipeSave {
  id: number;
  user_id: string;
  recipe_id: number;
  created_at: string;
}

const profiles: DemoProfile[] = [
  {
    id: 'demo-user-1',
    full_name: 'Sarah Chen',
    username: 'sarahcooks',
    avatar_url: null,
  },
  {
    id: 'demo-user-2',
    full_name: 'Marcus Johnson',
    username: 'marcusfoodie',
    avatar_url: null,
  },
  {
    id: 'demo-user-3',
    full_name: 'Emma Williams',
    username: 'emmabakes',
    avatar_url: null,
  },
];

/**
 * Demo Recipes
 * 
 * To add Cloudinary images, update the hero_image_url field with your Cloudinary URL.
 * Format: 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/vVERSION/FILENAME'
 * 
 * Example:
 * hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347281/1_zuvq2t.png'
 */
const recipes: DemoRecipe[] = [
  {
    id: 1,
    author_id: 'demo-user-1',
    title: 'Classic Margherita Pizza',
    description: 'A timeless Italian classic with fresh tomatoes, mozzarella, and basil. Simple ingredients that create magic.',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347291/2_shnsad.png',
    servings: 4,
    prep_minutes: 20,
    cook_minutes: 15,
    tags: ['Italian', 'Vegetarian', 'Pizza'],
    difficulty: 'Intermediate',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '500', unit: 'g', name: 'bread flour', note: null },
      { position: 1, quantity: '1', unit: 'tsp', name: 'salt', note: null },
      { position: 2, quantity: '1', unit: 'tsp', name: 'active dry yeast', note: null },
      { position: 3, quantity: '300', unit: 'ml', name: 'warm water', note: null },
      { position: 4, quantity: '2', unit: 'tbsp', name: 'olive oil', note: null },
      { position: 5, quantity: '400', unit: 'g', name: 'canned tomatoes', note: 'crushed' },
      { position: 6, quantity: '250', unit: 'g', name: 'fresh mozzarella', note: 'sliced' },
      { position: 7, quantity: '1/2', unit: 'cup', name: 'fresh basil leaves', note: null },
      { position: 8, quantity: '2', unit: 'cloves', name: 'garlic', note: 'minced' },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Mix flour, salt, and yeast in a large bowl. Add warm water and olive oil, then knead until smooth. Let rise for 1 hour.',
      },
      {
        position: 1,
        instruction: 'Preheat oven to 250°C (480°F). Roll out dough on a floured surface to desired thickness.',
      },
      {
        position: 2,
        instruction: 'Spread crushed tomatoes over dough, leaving a border. Add mozzarella slices and minced garlic.',
      },
      {
        position: 3,
        instruction: 'Bake for 12-15 minutes until crust is golden and cheese is bubbly. Top with fresh basil before serving.',
      },
    ],
  },
  {
    id: 2,
    author_id: 'demo-user-2',
    title: 'Chocolate Chip Cookies',
    description: 'The perfect chewy chocolate chip cookies with crispy edges and soft centers. A crowd favorite!',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347281/1_zuvq2t.png',
    servings: 24,
    prep_minutes: 15,
    cook_minutes: 12,
    tags: ['Dessert', 'Baking', 'Cookies'],
    difficulty: 'Easy',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '225', unit: 'g', name: 'butter', note: 'softened' },
      { position: 1, quantity: '150', unit: 'g', name: 'brown sugar', note: 'packed' },
      { position: 2, quantity: '100', unit: 'g', name: 'white sugar', note: null },
      { position: 3, quantity: '2', unit: 'large', name: 'eggs', note: null },
      { position: 4, quantity: '1', unit: 'tsp', name: 'vanilla extract', note: null },
      { position: 5, quantity: '280', unit: 'g', name: 'all-purpose flour', note: null },
      { position: 6, quantity: '1', unit: 'tsp', name: 'baking soda', note: null },
      { position: 7, quantity: '1', unit: 'tsp', name: 'salt', note: null },
      { position: 8, quantity: '300', unit: 'g', name: 'chocolate chips', note: 'semi-sweet' },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Preheat oven to 175°C (350°F). Cream together butter and both sugars until light and fluffy.',
      },
      {
        position: 1,
        instruction: 'Beat in eggs one at a time, then stir in vanilla. Mix in flour, baking soda, and salt.',
      },
      {
        position: 2,
        instruction: 'Fold in chocolate chips. Drop rounded tablespoons of dough onto ungreased baking sheets.',
      },
      {
        position: 3,
        instruction: 'Bake for 10-12 minutes until edges are golden. Let cool on baking sheet for 5 minutes before transferring.',
      },
    ],
  },
  {
    id: 3,
    author_id: 'demo-user-3',
    title: 'Beef Stir Fry',
    description: 'Quick and flavorful stir fry with tender beef, crisp vegetables, and a savory sauce. Ready in 20 minutes!',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347293/3_jqpnel.png',
    servings: 4,
    prep_minutes: 10,
    cook_minutes: 10,
    tags: ['Asian', 'Quick', 'Beef'],
    difficulty: 'Easy',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '500', unit: 'g', name: 'beef sirloin', note: 'thinly sliced' },
      { position: 1, quantity: '2', unit: 'tbsp', name: 'soy sauce', note: null },
      { position: 2, quantity: '1', unit: 'tbsp', name: 'cornstarch', note: null },
      { position: 3, quantity: '2', unit: 'tbsp', name: 'vegetable oil', note: null },
      { position: 4, quantity: '1', unit: 'large', name: 'bell pepper', note: 'sliced' },
      { position: 5, quantity: '1', unit: 'large', name: 'onion', note: 'sliced' },
      { position: 6, quantity: '2', unit: 'cloves', name: 'garlic', note: 'minced' },
      { position: 7, quantity: '1', unit: 'tbsp', name: 'ginger', note: 'grated' },
      { position: 8, quantity: '3', unit: 'tbsp', name: 'soy sauce', note: 'for sauce' },
      { position: 9, quantity: '1', unit: 'tbsp', name: 'oyster sauce', note: null },
      { position: 10, quantity: '1', unit: 'tsp', name: 'sesame oil', note: null },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Marinate beef with 2 tbsp soy sauce and cornstarch for 15 minutes.',
      },
      {
        position: 1,
        instruction: 'Heat oil in a large wok or skillet over high heat. Add beef and cook until browned, about 2-3 minutes. Remove and set aside.',
      },
      {
        position: 2,
        instruction: 'Add bell pepper and onion to the same pan. Stir-fry for 2-3 minutes until slightly softened.',
      },
      {
        position: 3,
        instruction: 'Add garlic and ginger, cook for 30 seconds. Return beef to pan. Add remaining soy sauce, oyster sauce, and sesame oil. Toss everything together and serve hot over rice.',
      },
    ],
  },
  {
    id: 4,
    author_id: 'demo-user-1',
    title: 'Caesar Salad',
    description: 'Crisp romaine lettuce with homemade croutons, parmesan cheese, and a creamy Caesar dressing.',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347282/4_uxx2eo.png',
    servings: 4,
    prep_minutes: 15,
    cook_minutes: 0,
    tags: ['Salad', 'Vegetarian', 'Quick'],
    difficulty: 'Easy',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '2', unit: 'heads', name: 'romaine lettuce', note: 'chopped' },
      { position: 1, quantity: '1/2', unit: 'cup', name: 'parmesan cheese', note: 'grated' },
      { position: 2, quantity: '2', unit: 'cups', name: 'croutons', note: 'homemade or store-bought' },
      { position: 3, quantity: '3', unit: 'cloves', name: 'garlic', note: 'minced' },
      { position: 4, quantity: '2', unit: 'anchovy fillets', name: 'anchovies', note: 'optional' },
      { position: 5, quantity: '2', unit: 'tbsp', name: 'lemon juice', note: 'fresh' },
      { position: 6, quantity: '1', unit: 'tsp', name: 'Dijon mustard', note: null },
      { position: 7, quantity: '1/2', unit: 'cup', name: 'mayonnaise', note: null },
      { position: 8, quantity: '1/4', unit: 'cup', name: 'olive oil', note: null },
      { position: 9, quantity: '1', unit: 'tsp', name: 'salt', note: null },
      { position: 10, quantity: '1/2', unit: 'tsp', name: 'black pepper', note: null },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Wash and dry romaine lettuce thoroughly. Tear into bite-sized pieces and place in a large bowl.',
      },
      {
        position: 1,
        instruction: 'For the dressing, mash anchovies with garlic. Whisk together with lemon juice, mustard, mayonnaise, and olive oil. Season with salt and pepper.',
      },
      {
        position: 2,
        instruction: 'Toss lettuce with dressing until well coated. Add croutons and parmesan cheese, then toss again.',
      },
      {
        position: 3,
        instruction: 'Serve immediately, garnishing with extra parmesan if desired.',
      },
    ],
  },
  {
    id: 5,
    author_id: 'demo-user-2',
    title: 'Chicken Tikka Masala',
    description: 'Creamy, spiced Indian curry with tender chicken pieces. Perfect served with basmati rice or naan bread.',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347286/5_mu9urr.png',
    servings: 6,
    prep_minutes: 30,
    cook_minutes: 40,
    tags: ['Indian', 'Curry', 'Chicken'],
    difficulty: 'Intermediate',
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '800', unit: 'g', name: 'chicken breast', note: 'cubed' },
      { position: 1, quantity: '1', unit: 'cup', name: 'plain yogurt', note: null },
      { position: 2, quantity: '2', unit: 'tbsp', name: 'lemon juice', note: null },
      { position: 3, quantity: '2', unit: 'tsp', name: 'garam masala', note: null },
      { position: 4, quantity: '1', unit: 'tsp', name: 'cumin', note: 'ground' },
      { position: 5, quantity: '1', unit: 'tsp', name: 'paprika', note: null },
      { position: 6, quantity: '1', unit: 'tsp', name: 'salt', note: null },
      { position: 7, quantity: '1', unit: 'large', name: 'onion', note: 'diced' },
      { position: 8, quantity: '3', unit: 'cloves', name: 'garlic', note: 'minced' },
      { position: 9, quantity: '1', unit: 'tbsp', name: 'ginger', note: 'grated' },
      { position: 10, quantity: '400', unit: 'ml', name: 'canned tomatoes', note: 'crushed' },
      { position: 11, quantity: '200', unit: 'ml', name: 'heavy cream', note: null },
      { position: 12, quantity: '2', unit: 'tbsp', name: 'butter', note: null },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Marinate chicken in yogurt, lemon juice, garam masala, cumin, paprika, and salt for at least 2 hours or overnight.',
      },
      {
        position: 1,
        instruction: 'Heat butter in a large pan. Add onion and cook until soft. Add garlic and ginger, cook for 1 minute.',
      },
      {
        position: 2,
        instruction: 'Add crushed tomatoes and spices. Simmer for 15 minutes until sauce thickens.',
      },
      {
        position: 3,
        instruction: 'Grill or pan-fry marinated chicken until cooked through. Add to sauce along with cream. Simmer for 5 minutes. Serve hot with rice or naan.',
      },
    ],
  },
  {
    id: 6,
    author_id: 'demo-user-3',
    title: 'Avocado Toast',
    description: 'Simple, healthy, and delicious. Perfect for breakfast or a light lunch. Customize with your favorite toppings!',
    hero_image_url: 'https://res.cloudinary.com/dool6mmp1/image/upload/v1764347289/6_ohjljw.png',
    servings: 2,
    prep_minutes: 5,
    cook_minutes: 5,
    tags: ['Breakfast', 'Vegetarian', 'Quick', 'Healthy'],
    difficulty: 'Easy',
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    recipe_ingredients: [
      { position: 0, quantity: '2', unit: 'slices', name: 'sourdough bread', note: 'thick-cut' },
      { position: 1, quantity: '1', unit: 'large', name: 'avocado', note: 'ripe' },
      { position: 2, quantity: '1', unit: 'tbsp', name: 'lemon juice', note: 'fresh' },
      { position: 3, quantity: '1/4', unit: 'tsp', name: 'salt', note: null },
      { position: 4, quantity: '1/4', unit: 'tsp', name: 'black pepper', note: null },
      { position: 5, quantity: '1', unit: 'pinch', name: 'red pepper flakes', note: 'optional' },
      { position: 6, quantity: '2', unit: 'eggs', name: 'eggs', note: 'poached, optional' },
    ],
    recipe_steps: [
      {
        position: 0,
        instruction: 'Toast bread until golden and crispy.',
      },
      {
        position: 1,
        instruction: 'Mash avocado with lemon juice, salt, and pepper until smooth but still slightly chunky.',
      },
      {
        position: 2,
        instruction: 'Spread avocado mixture generously on toast. Top with red pepper flakes if desired.',
      },
      {
        position: 3,
        instruction: 'Optional: Add a poached egg on top for extra protein. Serve immediately.',
      },
    ],
  },
];

const recipeSaves: DemoRecipeSave[] = [
  { id: 1, user_id: 'demo-user-1', recipe_id: 2, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, user_id: 'demo-user-2', recipe_id: 1, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, user_id: 'demo-user-3', recipe_id: 3, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

// Helper function to get save count for a recipe (deprecated - use demo-auth instead)
export const getRecipeSaveCount = (recipeId: number): number => {
  // This is now handled by demo-auth.ts for consistency
  if (typeof window !== 'undefined') {
    try {
      const { getRecipeSaveCount: getCount } = require('./demo-auth');
      return getCount(recipeId);
    } catch {
      // Fallback to local data if demo-auth not available
      return recipeSaves.filter((save) => save.recipe_id === recipeId).length;
    }
  }
  return recipeSaves.filter((save) => save.recipe_id === recipeId).length;
};

// Helper function to get all published recipes
export const getPublishedRecipes = (): DemoRecipe[] => {
  return recipes.filter((recipe) => recipe.is_published);
};

// Helper function to get recipe by ID
export const getRecipeById = (id: number): DemoRecipe | undefined => {
  return recipes.find((recipe) => recipe.id === id && recipe.is_published);
};

// Helper function to get profile by ID
export const getProfileById = (id: string): DemoProfile | undefined => {
  return profiles.find((profile) => profile.id === id);
};

// Helper function to search recipes
export const searchRecipes = (query: string): DemoRecipe[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return getPublishedRecipes();

  return getPublishedRecipes().filter((recipe) => {
    const matchesTitle = recipe.title.toLowerCase().includes(lowerQuery);
    const matchesDescription = recipe.description?.toLowerCase().includes(lowerQuery) ?? false;
    const matchesDifficulty = recipe.difficulty?.toLowerCase().includes(lowerQuery) ?? false;
    const matchesIngredient = recipe.recipe_ingredients.some((ing) =>
      ing.name.toLowerCase().includes(lowerQuery)
    );
    const matchesTag = recipe.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ?? false;

    return matchesTitle || matchesDescription || matchesDifficulty || matchesIngredient || matchesTag;
  });
};

// Helper function to get recipes by author
export const getRecipesByAuthor = (authorId: string): DemoRecipe[] => {
  return recipes.filter((recipe) => recipe.author_id === authorId && recipe.is_published);
};

// Helper function to get saved recipes for a user
export const getSavedRecipesForUser = (userId: string): DemoRecipe[] => {
  // Use demo-auth for consistency
  if (typeof window !== 'undefined') {
    try {
      const { getSavedRecipeIdsForDemoUser } = require('./demo-auth');
      const savedRecipeIds = getSavedRecipeIdsForDemoUser(userId);
      return recipes.filter((recipe) => savedRecipeIds.includes(recipe.id) && recipe.is_published);
    } catch {
      // Fallback to local data
      const savedRecipeIds = recipeSaves.filter((save) => save.user_id === userId).map((save) => save.recipe_id);
      return recipes.filter((recipe) => savedRecipeIds.includes(recipe.id) && recipe.is_published);
    }
  }
  const savedRecipeIds = recipeSaves.filter((save) => save.user_id === userId).map((save) => save.recipe_id);
  return recipes.filter((recipe) => savedRecipeIds.includes(recipe.id) && recipe.is_published);
};

// Helper function to check if recipe is saved by user
export const isRecipeSavedByUser = (recipeId: number, userId: string): boolean => {
  // Use demo-auth for consistency
  if (typeof window !== 'undefined') {
    try {
      const { isRecipeSavedByDemoUser } = require('./demo-auth');
      return isRecipeSavedByDemoUser(userId, recipeId);
    } catch {
      // Fallback to local data
      return recipeSaves.some((save) => save.recipe_id === recipeId && save.user_id === userId);
    }
  }
  return recipeSaves.some((save) => save.recipe_id === recipeId && save.user_id === userId);
};

export { profiles, recipes, recipeSaves };

