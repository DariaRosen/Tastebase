import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signOutUser } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (sessionToken) {
      signOutUser(sessionToken);
    }

    // Clear session cookie
    cookieStore.delete('session-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Signout] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign out' },
      { status: 500 }
    );
  }
}



