import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';

export async function GET() {
  const steps: any[] = [];
  
  try {
    // Step 1: Connect
    steps.push({ step: 'connect', status: 'starting' });
    await connectDB();
    steps.push({ step: 'connect', status: 'success' });

    // Step 2: Count recipes
    steps.push({ step: 'count', status: 'starting' });
    const count = await Recipe.countDocuments({ is_published: true });
    steps.push({ step: 'count', status: 'success', count });

    // Step 3: Find one recipe without populate
    steps.push({ step: 'find_one', status: 'starting' });
    const oneRecipe = await Recipe.findOne({ is_published: true }).lean().exec();
    steps.push({ 
      step: 'find_one', 
      status: 'success', 
      hasRecipe: !!oneRecipe,
      recipeId: oneRecipe?._id?.toString(),
      hasAuthorId: !!oneRecipe?.author_id,
      authorIdType: oneRecipe?.author_id ? typeof oneRecipe.author_id : null,
    });

    // Step 4: Try to find all without populate
    steps.push({ step: 'find_all', status: 'starting' });
    const allRecipes = await Recipe.find({ is_published: true }).lean().exec();
    steps.push({ 
      step: 'find_all', 
      status: 'success', 
      count: allRecipes?.length || 0 
    });

    // Step 5: Try with populate
    steps.push({ step: 'populate', status: 'starting' });
    const recipesWithPopulate = await Recipe.find({ is_published: true })
      .populate('author_id', 'full_name username avatar_url')
      .lean()
      .limit(1)
      .exec();
    steps.push({ 
      step: 'populate', 
      status: 'success', 
      count: recipesWithPopulate?.length || 0,
      firstAuthor: recipesWithPopulate?.[0]?.author_id ? 'exists' : 'missing',
    });

    return NextResponse.json({
      success: true,
      steps,
    });
  } catch (error) {
    steps.push({
      step: 'error',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      success: false,
      steps,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
    }, { status: 500 });
  }
}

