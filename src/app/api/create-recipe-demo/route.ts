import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDemoRecipe, type DemoRecipeData } from '@/lib/demo-auth';

// Helper to get demo user from cookies (since API routes run on server)
async function getDemoUserFromCookies() {
  const cookieStore = await cookies();
  const demoAuthCookie = cookieStore.get('tastebase-demo-auth');
  
  if (!demoAuthCookie) return null;
  
  try {
    const userId = JSON.parse(demoAuthCookie.value);
    // Get users from localStorage is not available on server, so we need to get it from cookies or request
    // For now, we'll get the user ID from the cookie and validate it in the request body
    return userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...recipeData } = body;
    
    // Validate user ID is provided
    if (!userId) {
      return NextResponse.json({ error: 'You must be signed in to create a recipe.' }, { status: 401 });
    }

    const {
      title,
      description,
      servings,
      prepMinutes,
      cookMinutes,
      tags,
      difficulty,
      heroImageUrl,
      ingredients,
      steps,
    } = recipeData;

    // Validate required fields
    if (!title || !description || !servings || prepMinutes === null || cookMinutes === null) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: 'Add at least one ingredient.' }, { status: 400 });
    }

    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: 'Add at least one step.' }, { status: 400 });
    }

    const tagArray = tags
      ? tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

    // Parse ingredients
    const ingredientRows = ingredients.map((line: string, index: number) => {
      const match = line.match(/^([0-9/.\s]+)\s+(.*)$/);
      if (!match) {
        return {
          position: index,
          quantity: null,
          name: line,
        };
      }
      const [_, quantity, name] = match;
      return {
        position: index,
        quantity: quantity.trim(),
        name: name.trim(),
      };
    });

    // Parse steps
    const stepRows = steps.map((instruction: string, index: number) => ({
      position: index,
      instruction,
    }));

    // Create recipe
    const recipePayload: Omit<DemoRecipeData, 'id' | 'created_at' | 'published_at'> = {
      author_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      hero_image_url: heroImageUrl || null,
      servings,
      prep_minutes: prepMinutes,
      cook_minutes: cookMinutes,
      tags: tagArray.length > 0 ? tagArray : null,
      difficulty: difficulty || null,
      is_published: true,
      recipe_ingredients: ingredientRows,
      recipe_steps: stepRows,
    };

    const newRecipe = createDemoRecipe(recipePayload);

    if (!newRecipe) {
      return NextResponse.json({ error: 'Failed to create recipe.' }, { status: 500 });
    }

    return NextResponse.json({ recipe: newRecipe, message: 'Recipe created successfully!' });
  } catch (error) {
    console.error('Demo recipe creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create recipe.' },
      { status: 500 }
    );
  }
}

