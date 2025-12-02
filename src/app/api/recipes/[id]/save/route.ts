import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { RecipeSave } from '@/lib/models/RecipeSave';
import { Recipe } from '@/lib/models/Recipe';
import { Types } from 'mongoose';

export async function POST(
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

    // Check if recipe exists and is published
    const recipe = await Recipe.findOne({ _id: id, is_published: true }).lean().exec();
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if already saved
    const existing = await RecipeSave.findOne({
      user_id: new Types.ObjectId(user.id),
      recipe_id: new Types.ObjectId(id),
    }).lean().exec();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already saved' });
    }

    // Save recipe
    await RecipeSave.create({
      user_id: new Types.ObjectId(user.id),
      recipe_id: new Types.ObjectId(id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Save Recipe] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save recipe' },
      { status: 500 }
    );
  }
}

