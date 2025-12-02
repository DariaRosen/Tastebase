import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { RecipeSave } from '@/lib/models/RecipeSave';
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

    // Remove save
    await RecipeSave.deleteOne({
      user_id: new Types.ObjectId(user.id),
      recipe_id: new Types.ObjectId(id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Unsave Recipe] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unsave recipe' },
      { status: 500 }
    );
  }
}

