'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
}

export const UserMenu = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            username: data.user.username ?? undefined,
            full_name: data.user.full_name ?? undefined,
            avatar_url: data.user.avatar_url,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    loadUser();

    // Check session periodically
    const interval = setInterval(loadUser, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu-root]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  const displayName = (user.full_name?.trim() || user.username || user.email || 'Account') as string;
  const initial = displayName[0]?.toUpperCase() ?? 'U';
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const hasAvatar = Boolean(user.avatar_url);
  const triggerClasses = hasAvatar
    ? 'inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border-subtle'
    : 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary text-white';

  return (
    <div className="relative" data-user-menu-root onBlur={handleBlur}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={triggerClasses}
        aria-label="Open user menu"
      >
        {hasAvatar ? (
          <Image
            src={user.avatar_url as string}
            alt={`${displayName} avatar`}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </button>
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg border border-border-subtle bg-white p-1 shadow-lg"
          role="menu"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        >
          <div className="px-3 py-2 text-sm font-semibold text-brand-secondary">{displayName}</div>
          <Link
            href="/wishlist"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-brand-secondary/80 hover:bg-brand-cream"
            role="menuitem"
          >
            Wishlist
          </Link>
          <Link
            href="/my-recipes"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-brand-secondary/80 hover:bg-brand-cream"
            role="menuitem"
          >
            My recipes
          </Link>
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-brand-secondary/80 hover:bg-brand-cream"
            role="menuitem"
          >
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-brand-secondary/80 hover:bg-brand-cream"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
