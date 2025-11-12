"use client";

import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface WishlistToggleProps {
  recipeId: number;
  initialSaved: boolean;
  initialCount: number;
}

export function WishlistToggle({
  recipeId,
  initialSaved,
  initialCount,
}: WishlistToggleProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.info('[WishlistToggle] unauthenticated user attempted to toggle', {
        recipeId,
      });
      setMessage("Please sign in to add recipes to your wishlist.");
      setIsLoading(false);
      return;
    }

    if (isSaved) {
      console.info('[WishlistToggle] removing from wishlist', {
        recipeId,
        userId: user.id,
      });
      await supabase
        .from("recipe_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);
      setIsSaved(false);
      setCount((prev) => Math.max(prev - 1, 0));
    } else {
      console.info('[WishlistToggle] adding to wishlist', {
        recipeId,
        userId: user.id,
      });
      await supabase.from("recipe_saves").insert({
        user_id: user.id,
        recipe_id: recipeId,
      });
      setIsSaved(true);
      setCount((prev) => prev + 1);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <form action={handleToggle} className="flex items-center gap-2">
			<button
				type="submit"
				className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition hover:bg-brand-primary/20 disabled:opacity-60"
				disabled={isLoading}
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
          {count} save{count === 1 ? "" : "s"}
        </span>
      </div>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}


