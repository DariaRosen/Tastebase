import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-service';
import { updateUserProfile } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, full_name, bio, avatar_url } = body;

    await connectDB();

    const updated = await updateUserProfile(user.id, {
      username: username || null,
      full_name: full_name || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ user: updated, success: true });
  } catch (error) {
    console.error('[Update Profile] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}

