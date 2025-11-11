'use client';

import { useEffect, useState } from 'react';
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

	const handleSignOut = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		setUser(null);
		setIsOpen(false);
	};

	if (!user) return null;

	const displayName = user.username ?? user.email ?? 'Account';
	const initial = displayName[0]?.toUpperCase() ?? 'U';

	return (
		<div className="relative">
			<button
				className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white"
				onClick={() => setIsOpen((v) => !v)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label="User menu"
			>
				{initial}
			</button>
			{isOpen && (
				<div
					className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
					role="menu"
					tabIndex={0}
					onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
				>
					<div className="px-3 py-2 text-sm font-semibold text-gray-800">{displayName}</div>
					<Link
						href="/wishlist"
						onClick={() => setIsOpen(false)}
						className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
						role="menuitem"
					>
						Wishlist
					</Link>
					<Link
						href="/profile"
						onClick={() => setIsOpen(false)}
						className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
						role="menuitem"
					>
						Profile
					</Link>
					<button
						onClick={handleSignOut}
						className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
						role="menuitem"
					>
						Sign out
					</button>
				</div>
			)}
		</div>
	);
};


