'use client';

import { useMemo, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { USE_SUPABASE } from '@/lib/data-config';
import { getDemoSession, saveRecipeToWishlist, removeRecipeFromWishlist, isRecipeSavedByDemoUser, getRecipeSaveCount } from '@/lib/demo-auth';

interface SaveRecipeToggleProps {
	recipeId: number;
	initialSaved: boolean;
	initialCount: number;
}

export const SaveRecipeToggle = ({
	recipeId,
	initialSaved,
	initialCount,
}: SaveRecipeToggleProps) => {
	const supabase = useMemo(() => (USE_SUPABASE ? createClient() : null), []);
	const [isSaved, setIsSaved] = useState(initialSaved);
	const [count, setCount] = useState(initialCount);
	const [message, setMessage] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	// Update saved state and count from demo data if not using Supabase
	useEffect(() => {
		if (!USE_SUPABASE) {
			const demoUser = getDemoSession();
			if (demoUser) {
				const saved = isRecipeSavedByDemoUser(demoUser.id, recipeId);
				const saveCount = getRecipeSaveCount(recipeId);
				setIsSaved(saved);
				setCount(saveCount);
			} else {
				setIsSaved(false);
				setCount(getRecipeSaveCount(recipeId));
			}
			
			// Listen for storage changes
			const handleStorageChange = () => {
				const user = getDemoSession();
				if (user) {
					const saved = isRecipeSavedByDemoUser(user.id, recipeId);
					const saveCount = getRecipeSaveCount(recipeId);
					setIsSaved(saved);
					setCount(saveCount);
				} else {
					setIsSaved(false);
					setCount(getRecipeSaveCount(recipeId));
				}
			};
			window.addEventListener('storage', handleStorageChange);
			const interval = setInterval(handleStorageChange, 500);
			
			return () => {
				window.removeEventListener('storage', handleStorageChange);
				clearInterval(interval);
			};
		}
	}, [recipeId]);

	const toggleSave = async () => {
		if (isPending) return;
		setIsPending(true);
		setMessage(null);

		if (!USE_SUPABASE) {
			// Use demo auth
			const demoUser = getDemoSession();
			if (!demoUser) {
				setMessage('Please sign in to add recipes to your wishlist.');
				setIsPending(false);
				return;
			}

			if (isSaved) {
				const { error } = removeRecipeFromWishlist(demoUser.id, recipeId);
				if (error) {
					setMessage(error.message);
					setIsPending(false);
					return;
				}
				setIsSaved(false);
				setCount((prev) => Math.max(prev - 1, 0));
			} else {
				const { error } = saveRecipeToWishlist(demoUser.id, recipeId);
				if (error) {
					setMessage(error.message);
					setIsPending(false);
					return;
				}
				setIsSaved(true);
				setCount((prev) => prev + 1);
			}
			setIsPending(false);
			return;
		}

		// Use Supabase
		if (!supabase) {
			setMessage('Authentication is not available.');
			setIsPending(false);
			return;
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			setMessage('Please sign in to add recipes to your wishlist.');
			setIsPending(false);
			return;
		}

		if (isSaved) {
			await supabase
				.from('recipe_saves')
				.delete()
				.eq('user_id', user.id)
				.eq('recipe_id', recipeId);
			setIsSaved(false);
			setCount((prev) => Math.max(prev - 1, 0));
		} else {
			await supabase.from('recipe_saves').insert({
				user_id: user.id,
				recipe_id: recipeId,
			});
			setIsSaved(true);
			setCount((prev) => prev + 1);
		}

		setIsPending(false);
	};

	return (
		<div className="flex flex-col items-start gap-2">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={toggleSave}
					disabled={isPending}
					className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition hover:bg-brand-primary/20 disabled:opacity-60"
					aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
				>
					<Heart
						className="h-5 w-5"
						fill={isSaved ? '#f57402' : 'transparent'}
						strokeWidth={isSaved ? 1.5 : 2}
						color={isSaved ? '#f57402' : 'currentColor'}
					/>
				</button>
				<span className="text-sm text-gray-600">
					{count} save{count === 1 ? '' : 's'}
				</span>
			</div>
			{message && <p className="text-xs text-red-600">{message}</p>}
		</div>
	);
};


