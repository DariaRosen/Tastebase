'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AuthDialog } from './auth/auth-dialog';
import { UserMenu } from './auth/user-menu';

export const Header = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/favicon.png"
            alt="Tastebase logo"
            width={32}
            height={32}
            className="h-9 w-9 rounded-md"
            priority
          />
          <span className="text-3xl font-bold text-orange-600 md:text-4xl">Tastebase</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Search
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
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

