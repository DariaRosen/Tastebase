import { NextRequest, NextResponse } from 'next/server';
import { fetchPublishedRecipes } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderBy = searchParams.get('orderBy') as 'published_at' | undefined;
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const { data, error } = await fetchPublishedRecipes(null, {
      orderBy,
      orderDirection,
      limit,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Recipes API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
