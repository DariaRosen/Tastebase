'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { USE_SUPABASE } from '@/lib/data-config';
import { signUpDemoUser, signInDemoUser } from '@/lib/demo-auth';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const TEST_PASSWORD = 'tastebase-dev';

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage(null);
      setError(null);
      setMode('login');
    }, 200);
  };

  const sanitizeUsername = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);

  const fallbackUsernameFromEmail = (emailValue: string) => {
    const base =
      sanitizeUsername(emailValue.split('@')[0] ?? '') ||
      `cook-${Math.random().toString(36).slice(2, 8)}`;
    return base;
  };

  const ensureProfile = async (
    supabase: ReturnType<typeof createClient>,
    usernameHint?: string,
    fullNameHint?: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadataUsername = sanitizeUsername((user.user_metadata as any)?.username ?? '');
    const metadataFullName = ((user.user_metadata as any)?.full_name as string | undefined)?.trim();

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const desiredUsername =
      sanitizeUsername(usernameHint ?? '') ||
      metadataUsername ||
      fallbackUsernameFromEmail(user.email ?? '') ||
      `cook-${user.id.slice(0, 6)}`;

    let candidate = desiredUsername;
    let suffix = 1;
    while (true) {
      const { data: clash } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .neq('id', user.id)
        .maybeSingle();

      if (!clash) break;

      const suffixStr = `-${suffix}`;
      const trimmed = candidate.slice(0, Math.max(0, 32 - suffixStr.length));
      candidate = sanitizeUsername(`${trimmed}${suffixStr}`);
      suffix += 1;
    }

    const fullNameCandidate =
      (fullNameHint && fullNameHint.trim()) ||
      existingProfile?.full_name?.trim() ||
      metadataFullName ||
      user.email ||
      candidate;

    const row: Record<string, unknown> = { id: user.id };
    if (!existingProfile?.username) {
      row.username = candidate;
    }
    if (!existingProfile?.full_name) {
      row.full_name = fullNameCandidate;
    }
    const avatarUrl = (user.user_metadata as any)?.avatar_url as string | undefined;
    if (avatarUrl) {
      row.avatar_url = avatarUrl;
    }

    if (Object.keys(row).length > 1) {
      const { error: profileError } = await supabase.from('profiles').upsert(row);
      if (profileError) {
        console.warn('[AuthDialog] failed to upsert profile', profileError);
      }
    }

    const metadataUpdates: Record<string, string> = {};
    if (!metadataUsername) {
      metadataUpdates.username = candidate;
    }
    if (!metadataFullName) {
      metadataUpdates.full_name = fullNameCandidate;
    }
    if (Object.keys(metadataUpdates).length > 0) {
      await supabase.auth.updateUser({ data: { ...user.user_metadata, ...metadataUpdates } }).catch((error) => {
        console.warn('[AuthDialog] failed to update auth metadata', error);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      // Use demo auth when Supabase is disabled
      if (!USE_SUPABASE) {
        if (mode === 'login') {
          const { user, error: signInError } = await signInDemoUser(email);
          if (signInError) {
            // If user doesn't exist, try to create them
            const cleanedFullName = name.trim();
            const { user: newUser, error: signUpError } = await signUpDemoUser(email, cleanedFullName);
            if (signUpError) {
              setError(signUpError.message);
              setIsLoading(false);
              return;
            }
            setMessage('Account created and signed in.');
            onOpenChange(false);
            // Refresh page to update auth state
            setTimeout(() => window.location.reload(), 500);
            return;
          }
          setMessage('Signed in.');
          onOpenChange(false);
          // Refresh page to update auth state
          setTimeout(() => window.location.reload(), 500);
        } else {
          // Sign up mode
          const cleanedFullName = name.trim();
          const { user, error: signUpError } = await signUpDemoUser(email, cleanedFullName);
          if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
          }
          setMessage('Account created. You are signed in.');
          onOpenChange(false);
          // Refresh page to update auth state
          setTimeout(() => window.location.reload(), 500);
        }
        return;
      }
      
      // Use Supabase auth
      const supabase = createClient();
      if (!supabase) {
        setError('Supabase client is not available. Please check your configuration.');
        setIsLoading(false);
        return;
      }
      if (mode === 'login') {
        const fallbackUsername = fallbackUsernameFromEmail(email);
        // Try sign in; if it fails (user not found), auto-create then sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD });
        if (signInError) {
          const fullName = name.trim();
          await supabase.auth
            .signUp({
              email,
              password: TEST_PASSWORD,
              options: {
                emailRedirectTo: undefined,
                data: {
                  username: fallbackUsername,
                  full_name: fullName || fallbackUsername,
                },
              },
            })
            .catch(() => {});
          const { error: secondTry } = await supabase.auth.signInWithPassword({
            email,
            password: TEST_PASSWORD,
          });
          if (secondTry) {
            setError(secondTry.message);
            setIsLoading(false);
            return;
          }
        }
        await ensureProfile(supabase, fallbackUsername, name);
        setMessage('Signed in.');
        onOpenChange(false);
      } else {
        const cleanedFullName = name.trim();
        const metadataUsername =
          sanitizeUsername(cleanedFullName) || fallbackUsernameFromEmail(email);
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: TEST_PASSWORD,
          options: {
            data: {
              username: metadataUsername,
              full_name: cleanedFullName || metadataUsername,
            },
            emailRedirectTo: undefined,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD }).catch(() => {});
          await ensureProfile(supabase, metadataUsername, cleanedFullName);
          setMessage('Account created. You are signed in.');
          onOpenChange(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevEmailOnly = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      // Use demo auth when Supabase is disabled
      if (!USE_SUPABASE) {
        const cleanedFullName = name.trim();
        const { user, error: signInError } = await signInDemoUser(email);
        if (signInError) {
          // If user doesn't exist, create them
          const { user: newUser, error: signUpError } = await signUpDemoUser(email, cleanedFullName);
          if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
          }
          setMessage('Account created and signed in (dev).');
          onOpenChange(false);
          setTimeout(() => window.location.reload(), 500);
          return;
        }
        setMessage('Signed in (dev).');
        onOpenChange(false);
        setTimeout(() => window.location.reload(), 500);
        return;
      }
      
      // Use Supabase auth
      const supabase = createClient();
      if (!supabase) {
        setError('Supabase client is not available. Please check your configuration.');
        setIsLoading(false);
        return;
      }
      let { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      });
      const cleanedFullName = name.trim();
      if (signInErr) {
        const fallbackUsername = fallbackUsernameFromEmail(email);
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password: TEST_PASSWORD,
          options: {
            emailRedirectTo: undefined,
            data: {
              username: fallbackUsername,
              full_name: cleanedFullName || fallbackUsername,
            },
          },
        });
        if (signUpErr) {
          setError(signUpErr.message);
          setIsLoading(false);
          return;
        }
        const { error: signInErr2 } = await supabase.auth.signInWithPassword({
          email,
          password: TEST_PASSWORD,
        });
        if (signInErr2) {
          setError(signInErr2.message);
          setIsLoading(false);
          return;
        }
        await ensureProfile(supabase, fallbackUsername, cleanedFullName);
      }
      await ensureProfile(supabase, undefined, cleanedFullName);
      setMessage('Signed in (dev).');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </h2>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            className="text-sm font-medium text-brand-primary hover:underline"
            aria-label="Toggle auth mode"
          >
            {mode === 'login' ? 'Create account' : 'Have an account? Log in'}
          </button>
        </div>
        {!USE_SUPABASE && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Demo Mode Active</p>
            <p className="mt-1 text-xs">
              Using local demo authentication. Your account will be stored in browser storage.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Name</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={64}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
                placeholder="Jane Doe"
                aria-label="Name"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
              placeholder="you@example.com"
              aria-label="Email address"
            />
          </label>
          {mode === 'login' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
                placeholder="Jane Doe"
                aria-label="Name"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:opacity-60"
            aria-busy={isLoading}
            aria-disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
        <div className="my-4 h-px w-full bg-gray-200" />
        <p className="text-xs text-gray-500">
          Dev-only: no password field. A fixed password is used behind the scenes.
        </p>
        <button
          onClick={handleClose}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </div>
  );
};


