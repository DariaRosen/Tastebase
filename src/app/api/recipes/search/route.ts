import { NextRequest, NextResponse } from 'next/server';
import { searchRecipesData } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    const { data, error } = await searchRecipesData(null, query);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Search Recipes] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search recipes' },
      { status: 500 }
    );
  }
}

