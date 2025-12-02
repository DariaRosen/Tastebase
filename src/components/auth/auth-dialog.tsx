'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
    setTimeout(() => {
      setName('');
      setEmail('');
      setPassword('');
      setMessage(null);
      setError(null);
      setMode('login');
    }, 200);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            fullName: name.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to create account');
          setIsLoading(false);
          return;
        }

        setMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.refresh();
          handleClose();
        }, 1000);
      } else {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid email or password');
          setIsLoading(false);
          return;
        }

        setMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.refresh();
          handleClose();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-6 text-2xl font-bold text-brand-secondary">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{message}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-brand-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium text-brand-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
