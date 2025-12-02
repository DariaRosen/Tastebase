import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';
import { RecipeSave } from '@/lib/models/RecipeSave';
import { Types } from 'mongoose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    await connectDB();

    const recipe = await Recipe.findOne({ _id: id, author_id: user.id }).lean().exec();
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or unauthorized' }, { status: 404 });
    }

    // Delete recipe and associated saves
    await Recipe.deleteOne({ _id: id });
    await RecipeSave.deleteMany({ recipe_id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delete Recipe] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}

