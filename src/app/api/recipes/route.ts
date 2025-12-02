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
      console.error('[Recipes API] Error from fetchPublishedRecipes:', error);
      console.error('[Recipes API] Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message, details: process.env.NODE_ENV === 'development' ? error.stack : undefined },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Recipes API] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[Recipes API] Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch recipes',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
