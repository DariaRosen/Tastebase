'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserInfo {
	id: string;
	email?: string;
	username?: string;
	avatarUrl?: string | null;
}

export const UserMenu = () => {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const supabase = createClient();
		let mounted = true;

		const resolveUser = async (authUser: User | null): Promise<UserInfo | null> => {
			if (!authUser) return null;

			const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
			const initialUsername = typeof metadata.username === 'string' ? metadata.username : undefined;
			const initialAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined;

			if (initialUsername && initialAvatar) {
				return {
					id: authUser.id,
					email: authUser.email ?? undefined,
					username: initialUsername,
					avatarUrl: initialAvatar,
				};
			}

			const { data: profile } = await supabase
				.from('profiles')
				.select('username, avatar_url')
				.eq('id', authUser.id)
				.single();

			return {
				id: authUser.id,
				email: authUser.email ?? undefined,
				username: profile?.username ?? initialUsername,
				avatarUrl: profile?.avatar_url ?? initialAvatar ?? null,
			};
		};

		(async () => {
			const { data } = await supabase.auth.getUser();
			if (!mounted) return;
			const info = await resolveUser(data.user);
			if (mounted) setUser(info);
		})();

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!mounted) return;
			if (session?.user) {
				resolveUser(session.user).then((info) => {
					if (mounted) setUser(info);
				});
			} else {
				setUser(null);
			}
		});

		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
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
		const supabase = createClient();
		await supabase.auth.signOut();
		setUser(null);
		setIsOpen(false);
	};

	if (!user) return null;

	const displayName = user.username ?? user.email ?? 'Account';
	const initial = displayName[0]?.toUpperCase() ?? 'U';
	const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			setIsOpen(false);
		}
	};

	const hasAvatar = Boolean(user.avatarUrl);
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
						src={user.avatarUrl as string}
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


