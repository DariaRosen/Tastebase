'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { TabSwitcher } from '@/components/tab-switcher';
import { RecipeCard } from '@/components/recipe-card';
import { createClient } from '@/lib/supabase';

type Tab = 'latest' | 'popular';

// Mock data for demonstration
const mockRecipes = [
  {
    id: '1',
    title: 'Classic Chocolate Chip Cookies',
    description: 'Soft and chewy cookies with the perfect balance of chocolate chips and vanilla.',
    authorName: 'Sarah Johnson',
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    likes: 142,
    tags: ['dessert', 'baking', 'cookies'],
  },
  {
    id: '2',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A healthy and flavorful bowl with quinoa, fresh vegetables, and tahini dressing.',
    authorName: 'Michael Chen',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    likes: 89,
    tags: ['healthy', 'vegetarian', 'quinoa'],
  },
  {
    id: '3',
    title: 'Spicy Thai Green Curry',
    description: 'Authentic Thai curry with coconut milk, vegetables, and aromatic spices.',
    authorName: 'Emma Williams',
    prepTime: 25,
    cookTime: 20,
    servings: 6,
    likes: 203,
    tags: ['thai', 'curry', 'spicy'],
  },
  {
    id: '4',
    title: 'Homemade Margherita Pizza',
    description: 'Traditional Italian pizza with fresh mozzarella, basil, and tomato sauce.',
    authorName: 'David Martinez',
    prepTime: 30,
    cookTime: 10,
    servings: 4,
    likes: 167,
    tags: ['italian', 'pizza', 'vegetarian'],
  },
  {
    id: '5',
    title: 'Beef Tacos with Fresh Salsa',
    description: 'Tender seasoned beef in warm tortillas topped with fresh salsa and avocado.',
    authorName: 'Jessica Lee',
    prepTime: 15,
    cookTime: 20,
    servings: 6,
    likes: 124,
    tags: ['mexican', 'tacos', 'beef'],
  },
  {
    id: '6',
    title: 'Creamy Mushroom Risotto',
    description: 'Rich and creamy risotto with wild mushrooms and parmesan cheese.',
    authorName: 'Robert Taylor',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    likes: 98,
    tags: ['italian', 'risotto', 'vegetarian'],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('latest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.user));
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // In a real app, this would filter based on the active tab
  const displayedRecipes = mockRecipes;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Recipes
            </h1>
            <p className="text-gray-600">
              Explore delicious recipes from our community of home cooks
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              aria-label="Add new recipe"
            >
              Add new recipe
            </Link>
          )}
        </div>

        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-8">
          {displayedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} {...recipe} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg text-gray-600 mb-2">No recipes found</p>
              <p className="text-sm text-gray-500">
                Be the first to share a recipe!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
