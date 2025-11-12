import { Suspense } from 'react';
import { Header } from '@/components/header';
import SearchResultsClient from './search-results-client';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const initialQuery = resolved.q?.toString() ?? '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Suspense fallback={<div className="text-gray-500">Loading search…</div>}>
          <SearchResultsClient initialQuery={initialQuery} />
        </Suspense>
      </main>
    </div>
  );
}
