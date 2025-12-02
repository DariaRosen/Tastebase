import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/lib/auth-service';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const user = getUserFromSession(sessionToken);

    if (!user) {
      // Clear invalid session cookie
      cookieStore.delete('session-token');
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[Auth Session] Error:', error);
    return NextResponse.json({ user: null });
  }
}

