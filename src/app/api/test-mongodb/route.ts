import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();
    
    // Test collections
    const userCount = await User.countDocuments();
    const recipeCount = await Recipe.countDocuments();
    
    // Try to fetch one recipe
    const sampleRecipe = await Recipe.findOne({ is_published: true }).lean().exec();
    
    return NextResponse.json({
      success: true,
      connected: true,
      counts: {
        users: userCount,
        recipes: recipeCount,
      },
      sampleRecipe: sampleRecipe ? {
        id: sampleRecipe._id,
        title: sampleRecipe.title,
        hasAuthor: !!sampleRecipe.author_id,
      } : null,
      collections: {
        user: 'user',
        recipe: 'recipe',
        recipesave: 'recipesave',
      },
    });
  } catch (error) {
    console.error('[Test MongoDB] Error:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

