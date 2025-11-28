"use client";

import { useMemo, useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { USE_SUPABASE } from "@/lib/data-config";
import { getDemoSession, saveRecipeToWishlist, removeRecipeFromWishlist, isRecipeSavedByDemoUser, getRecipeSaveCount } from "@/lib/demo-auth";

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
  const supabase = useMemo(() => (USE_SUPABASE ? createClient() : null), []);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleToggle = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    if (!USE_SUPABASE) {
      // Use demo auth
      const demoUser = getDemoSession();
      if (!demoUser) {
        setMessage("Please sign in to add recipes to your wishlist.");
        setIsLoading(false);
        return;
      }

      if (isSaved) {
        const { error } = removeRecipeFromWishlist(demoUser.id, recipeId);
        if (error) {
          setMessage(error.message);
          setIsLoading(false);
          return;
        }
        setIsSaved(false);
        setCount((prev) => Math.max(prev - 1, 0));
      } else {
        const { error } = saveRecipeToWishlist(demoUser.id, recipeId);
        if (error) {
          setMessage(error.message);
          setIsLoading(false);
          return;
        }
        setIsSaved(true);
        setCount((prev) => prev + 1);
      }
      setIsLoading(false);
      return;
    }

    // Use Supabase
    if (!supabase) {
      setMessage("Authentication is not available.");
      setIsLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to add recipes to your wishlist.");
      setIsLoading(false);
      return;
    }

    if (isSaved) {
      await supabase
        .from("recipe_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);
      setIsSaved(false);
      setCount((prev) => Math.max(prev - 1, 0));
    } else {
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
        </form>
        <span className="text-sm text-gray-600">
          {count} save{count === 1 ? "" : "s"}
        </span>
      </div>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}


