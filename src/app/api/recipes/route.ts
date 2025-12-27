import { NextRequest, NextResponse } from 'next/server';
import { fetchPublishedRecipes } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderBy = searchParams.get('orderBy') as 'published_at' | undefined;
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Check if MongoDB URL is configured
    if (!process.env.MONGO_URL) {
      console.error('[Recipes API] MONGO_URL environment variable is not set');
      console.error('[Recipes API] Available env keys:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB')));
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          message: 'MongoDB connection string is not configured. Please set MONGO_URL environment variable in Vercel.',
          details: 'Check Vercel project settings → Environment Variables',
        },
        { status: 500 }
      );
    }

    console.log('[Recipes API] Fetching recipes with options:', { orderBy, orderDirection, limit });
    const { data, error } = await fetchPublishedRecipes(null, {
      orderBy,
      orderDirection,
      limit,
    });

    if (error) {
      console.error('[Recipes API] Error from fetchPublishedRecipes:', error);
      console.error('[Recipes API] Error stack:', error.stack);
      console.error('[Recipes API] Error name:', error.name);
      console.error('[Recipes API] Error message:', error.message);
      
      // Provide more helpful error messages
      let userMessage = 'Failed to fetch recipes';
      if (error.message.includes('MONGO_URL') || error.message.includes('environment variable')) {
        userMessage = 'Database configuration error. Please check server configuration.';
      } else if (error.message.includes('authentication') || error.message.includes('password') || error.message.includes('credentials')) {
        userMessage = 'Database authentication failed. Please verify MONGO_URL contains the correct password in Vercel environment variables.';
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        userMessage = 'Database connection error. Please try again later.';
      }
      
      return NextResponse.json(
        { 
          error: error.message,
          errorName: error.name,
          message: userMessage,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Recipes API] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[Recipes API] Error stack:', error.stack);
      console.error('[Recipes API] Error message:', error.message);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch recipes',
        message: 'An unexpected error occurred while fetching recipes',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
