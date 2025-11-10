import Link from 'next/link';
import { Search, User, Plus } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-orange-600">Tastebase</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Search
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            aria-label="Create Recipe"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Create</span>
          </button>
          <button
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

