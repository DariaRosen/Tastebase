'use client';

import { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface WishlistToggleProps {
	recipeId: number;
	userId: string | null;
	initialIsSaved: boolean;
	initialCount: number;
}

export const WishlistToggle = ({
	recipeId,
	userId,
	initialIsSaved,
	initialCount,
}: WishlistToggleProps) => {
	const supabase = useMemo(() => createClient(), []);
	const [isSaved, setIsSaved] = useState(initialIsSaved);
	const [count, setCount] = useState(initialCount);
	const [message, setMessage] = useState<string | null>(null);
	const [isBusy, setIsBusy] = useState(false);

	const handleClick = async () => {
		if (!userId) {
			setMessage('Please sign in to use your wishlist.');
			setTimeout(() => setMessage(null), 2000);
			return;
		}
		if (isBusy) return;

		setIsBusy(true);
		const prevSaved = isSaved;
		const prevCount = count;
		try {
			if (isSaved) {
				setIsSaved(false);
				setCount((prev) => Math.max(prev - 1, 0));
				await supabase
					.from('recipe_saves')
					.delete()
					.eq('user_id', userId)
					.eq('recipe_id', recipeId);
			} else {
				setIsSaved(true);
				setCount((prev) => prev + 1);
				await supabase.from('recipe_saves').insert({
					user_id: userId,
					recipe_id: recipeId,
				});
			}
		} catch (error) {
			setIsSaved(prevSaved);
			setCount(prevCount);
			setMessage(
				error instanceof Error ? error.message : 'Could not update wishlist. Please try again.',
			);
			setTimeout(() => setMessage(null), 2000);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={handleClick}
				disabled={isBusy}
				className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-400 hover:text-orange-600 disabled:opacity-60"
			>
				<Heart
					className="h-5 w-5"
					fill={isSaved ? '#ea580c' : 'transparent'}
					strokeWidth={isSaved ? 1.5 : 2}
					color={isSaved ? '#ea580c' : 'currentColor'}
				/>
				<span>{isSaved ? 'Saved' : 'Save to wishlist'}</span>
				<span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
					{count}
				</span>
			</button>
			{message && <p className="text-xs text-red-600">{message}</p>}
		</div>
	);
};


