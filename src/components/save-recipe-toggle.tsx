'use client';

import { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase';

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
	const supabase = useMemo(() => createClient(), []);
	const [isSaved, setIsSaved] = useState(initialSaved);
	const [count, setCount] = useState(initialCount);
	const [message, setMessage] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	const toggleSave = async () => {
		if (isPending) return;
		setIsPending(true);
		setMessage(null);

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
					className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-600/10 text-orange-600 transition hover:bg-orange-600/20 disabled:opacity-60"
					aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
				>
					<Heart
						className="h-5 w-5"
						fill={isSaved ? '#ea580c' : 'transparent'}
						strokeWidth={isSaved ? 1.5 : 2}
						color="#ea580c"
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


