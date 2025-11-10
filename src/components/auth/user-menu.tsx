'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface UserInfo {
	id: string;
	email?: string;
	full_name?: string | null;
	avatar_url?: string | null;
}

export const UserMenu = () => {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const supabase = createClient();
		let mounted = true;

		async function load() {
			const { data } = await supabase.auth.getUser();
			if (!mounted) return;
			if (data.user) {
				setUser({
					id: data.user.id,
					email: data.user.email ?? undefined,
				});
			} else {
				setUser(null);
			}
		}

		load();

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
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

	const initial = user.email?.[0]?.toUpperCase() ?? 'U';

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
					<div className="px-3 py-2 text-sm text-gray-600">{user.email}</div>
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


