'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, LogIn } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { USE_SUPABASE } from '@/lib/data-config';
import { getDemoSession } from '@/lib/demo-auth';
import { AuthDialog } from './auth/auth-dialog';
import { UserMenu } from './auth/user-menu';

export const Header = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!USE_SUPABASE) {
      // Check demo auth
      const demoUser = getDemoSession();
      setIsLoggedIn(Boolean(demoUser));
      
      // Listen for storage changes (when user signs in/out in another tab)
      const handleStorageChange = () => {
        const user = getDemoSession();
        setIsLoggedIn(Boolean(user));
      };
      window.addEventListener('storage', handleStorageChange);
      // Also check periodically for same-tab changes
      const interval = setInterval(() => {
        const user = getDemoSession();
        setIsLoggedIn(Boolean(user));
      }, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }

    const supabase = createClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.user));
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchValue('');
  };

  const handleMobileSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchValue('');
    } else {
      router.push('/search');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3" aria-label="Tastebase home">
          <Image
            src="/favicon.png"
            alt="Tastebase logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-md"
            priority
          />
          <span className="text-4xl font-bold text-brand-secondary md:text-5xl">Tastebase</span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="relative hidden w-full max-w-lg items-center md:flex"
          role="search"
        >
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Find a recipe or ingredient"
            className="h-12 w-full rounded-l-full border border-border-subtle bg-white px-5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            aria-label="Search for recipes"
          />
          <button
            type="submit"
            className="flex h-12 w-14 items-center justify-center rounded-r-full bg-brand-primary text-white transition hover:bg-brand-primary-hover"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 md:hidden">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search"
              className="h-10 w-40 rounded-xl border border-border-subtle bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none"
              aria-label="Search for recipes"
            />
            <button
              type="button"
              onClick={handleMobileSearch}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-brand-cream hover:text-brand-secondary"
              aria-label="Sign in"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>
      </div>

      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </header>
  );
};

