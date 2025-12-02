import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signUpUser } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { user, error, sessionToken } = await signUpUser(email, password, fullName, username);

    if (error || !user || !sessionToken) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ user, success: true });
  } catch (error) {
    console.error('[Auth Signup] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign up' },
      { status: 500 }
    );
  }
}

