'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, LogIn } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthDialog } from './auth/auth-dialog';
import { UserMenu } from './auth/user-menu';

export const Header = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  useEffect(() => {
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/favicon.png"
            alt="Tastebase logo"
            width={56}
            height={56}
            className="h-12 w-12 rounded-lg"
            priority
          />
          <span className="text-4xl font-bold text-orange-600 md:text-5xl">Tastebase</span>
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
            className="h-12 w-full rounded-l-full border border-gray-300 bg-white px-5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            aria-label="Search for recipes"
          />
          <button
            type="submit"
            className="flex h-12 w-14 items-center justify-center rounded-r-full bg-orange-600 text-white transition hover:bg-orange-700"
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
              className="h-10 w-40 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none"
              aria-label="Search for recipes"
            />
            <button
              type="button"
              onClick={handleMobileSearch}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700"
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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

