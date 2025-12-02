/**
 * Authentication Service for MongoDB
 * 
 * Handles user authentication, session management, and profile operations
 */

import connectDB from './mongodb';
import { User, IUser } from './models/User';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: Date;
}

// Session storage (in production, use Redis or database)
const sessions = new Map<string, AuthSession>();

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Verify a password
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Create a session token
 */
const createSessionToken = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
};

/**
 * Sign up a new user
 */
export const signUpUser = async (
  email: string,
  password: string,
  fullName?: string,
  username?: string
): Promise<{ user: AuthUser | null; error: Error | null; sessionToken?: string }> => {
  try {
    await connectDB();

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() }).lean().exec();
    if (existing) {
      return {
        user: null,
        error: new Error('User with this email already exists. Try logging in instead.'),
      };
    }

    // Generate username if not provided
    const sanitizeUsername = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);

    let finalUsername = username?.trim() || '';
    if (!finalUsername) {
      const emailBase = email.split('@')[0] || '';
      finalUsername = sanitizeUsername(emailBase) || `cook-${Math.random().toString(36).slice(2, 8)}`;
    } else {
      finalUsername = sanitizeUsername(finalUsername);
    }

    // Ensure username is unique
    let suffix = 1;
    let candidate = finalUsername;
    while (await User.findOne({ username: candidate }).lean().exec()) {
      const suffixStr = `-${suffix}`;
      const trimmed = finalUsername.slice(0, Math.max(0, 32 - suffixStr.length));
      candidate = `${trimmed}${suffixStr}`;
      suffix += 1;
    }
    finalUsername = candidate;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      full_name: fullName?.trim() || null,
      username: finalUsername,
      avatar_url: null,
      bio: null,
    });

    await newUser.save();

    const authUser: AuthUser = {
      id: newUser._id.toString(),
      email: newUser.email,
      full_name: newUser.full_name ?? null,
      username: newUser.username ?? null,
      avatar_url: newUser.avatar_url ?? null,
      bio: newUser.bio ?? null,
    };

    // Create session
    const sessionToken = createSessionToken();
    sessions.set(sessionToken, {
      user: authUser,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { user: authUser, error: null, sessionToken };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to create user'),
    };
  }
};

/**
 * Sign in a user
 */
export const signInUser = async (
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: Error | null; sessionToken?: string }> => {
  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).lean().exec();
    if (!user || !user.password) {
      return {
        user: null,
        error: new Error('Invalid email or password'),
      };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return {
        user: null,
        error: new Error('Invalid email or password'),
      };
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name ?? null,
      username: user.username ?? null,
      avatar_url: user.avatar_url ?? null,
      bio: user.bio ?? null,
    };

    // Create session
    const sessionToken = createSessionToken();
    sessions.set(sessionToken, {
      user: authUser,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { user: authUser, error: null, sessionToken };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to sign in'),
    };
  }
};

/**
 * Get user from session token
 */
export const getUserFromSession = (sessionToken: string | null): AuthUser | null => {
  if (!sessionToken) return null;

  const session = sessions.get(sessionToken);
  if (!session) return null;

  // Check if session expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionToken);
    return null;
  }

  return session.user;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await User.findById(userId).lean().exec();
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name ?? null,
      username: user.username ?? null,
      avatar_url: user.avatar_url ?? null,
      bio: user.bio ?? null,
    };
  } catch {
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<IUser, 'full_name' | 'username' | 'avatar_url' | 'bio'>>
): Promise<AuthUser | null> => {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    // If updating username, ensure it's unique
    if (updates.username) {
      const sanitizeUsername = (value: string) =>
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 32);

      updates.username = sanitizeUsername(updates.username);
      const existing = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      }).lean().exec();

      if (existing) {
        throw new Error('Username is already taken');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, lean: true }
    ).exec();

    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name ?? null,
      username: user.username ?? null,
      avatar_url: user.avatar_url ?? null,
      bio: user.bio ?? null,
    };
  } catch (error) {
    console.error('[AuthService] Update profile error:', error);
    return null;
  }
};

/**
 * Sign out (remove session)
 */
export const signOutUser = (sessionToken: string): void => {
  sessions.delete(sessionToken);
};

/**
 * Get session token from request (for server-side)
 */
export const getSessionTokenFromRequest = async (): Promise<string | null> => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('session-token')?.value ?? null;
};

/**
 * Get current user from request (for server-side)
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const token = await getSessionTokenFromRequest();
  if (!token) return null;
  return getUserFromSession(token);
};

