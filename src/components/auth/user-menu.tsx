'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { USE_SUPABASE } from '@/lib/data-config';
import { getDemoSession, signOutDemoUser } from '@/lib/demo-auth';
import type { User } from '@supabase/supabase-js';

interface UserInfo {
	id: string;
	email?: string;
	username?: string;
	fullName?: string;
	avatarUrl?: string | null;
}

export const UserMenu = () => {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!USE_SUPABASE) {
			// Use demo auth
			let mounted = true;
			
			const loadDemoUser = () => {
				if (!mounted) return;
				const demoUser = getDemoSession();
				if (demoUser) {
					setUser({
						id: demoUser.id,
						email: demoUser.email,
						username: demoUser.username ?? undefined,
						fullName: demoUser.full_name ?? undefined,
						avatarUrl: demoUser.avatar_url,
					});
				} else {
					setUser(null);
				}
			};
			
			loadDemoUser();
			
			// Listen for storage changes
			const handleStorageChange = () => {
				loadDemoUser();
			};
			window.addEventListener('storage', handleStorageChange);
			
			// Check periodically for same-tab changes
			const interval = setInterval(loadDemoUser, 1000);
			
			return () => {
				mounted = false;
				window.removeEventListener('storage', handleStorageChange);
				clearInterval(interval);
			};
		}

		const supabase = createClient();
		let mounted = true;

		const resolveUser = async (authUser: User | null): Promise<UserInfo | null> => {
			if (!authUser) return null;

			const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
			const initialUsername = typeof metadata.username === 'string' ? metadata.username : undefined;
			const initialFullName = typeof metadata.full_name === 'string' ? metadata.full_name : undefined;
			const initialAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined;

			if (initialUsername && initialAvatar && initialFullName) {
				return {
					id: authUser.id,
					email: authUser.email ?? undefined,
					username: initialUsername,
					fullName: initialFullName,
					avatarUrl: initialAvatar,
				};
			}

			const { data: profile } = await supabase
				.from('profiles')
				.select('username, full_name, avatar_url')
				.eq('id', authUser.id)
				.single();

			return {
				id: authUser.id,
				email: authUser.email ?? undefined,
				username: profile?.username ?? initialUsername,
				fullName: profile?.full_name ?? initialFullName,
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
		if (!USE_SUPABASE) {
			signOutDemoUser();
			setUser(null);
			setIsOpen(false);
			window.location.reload();
			return;
		}
		
		const supabase = createClient();
		await supabase.auth.signOut();
		setUser(null);
		setIsOpen(false);
	};

	if (!user) return null;

	const displayName = (user.fullName?.trim() || user.username || user.email || 'Account') as string;
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


