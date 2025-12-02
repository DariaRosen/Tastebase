'use client';

import { CreateRecipeForm } from './create-form';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRecipePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (!data.user) {
          router.push('/');
          return;
        }
        setIsAuthenticated(true);
        setIsChecking(false);
      } catch {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream-soft">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-cream-soft">
      <div className="flex justify-end px-4 pt-10">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
        >
          Back to recipes
        </Link>
      </div>
      <div className="container mx-auto px-4 pb-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-secondary">Add new recipe</h1>
            <p className="text-gray-600">
              Share your latest creation. Provide at least a title, description, servings, prep time, cook time, and steps.
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm">
            <CreateRecipeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
