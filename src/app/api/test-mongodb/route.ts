import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbURL = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME || 'Tastbase';
    
    // Test MongoDB connection string construction
    const testUri = dbURL ? `${dbURL}${dbName}?retryWrites=true&w=majority` : 'NOT SET';
    
    return NextResponse.json({
      success: true,
      env: {
        MONGO_URL_set: !!dbURL,
        MONGO_URL_length: dbURL ? dbURL.length : 0,
        DB_NAME: dbName,
        constructed_uri_preview: dbURL ? `${dbURL.substring(0, 30)}...${dbName}` : 'NOT SET',
      },
      connection_string_construction: testUri.substring(0, 50) + '...',
    });
  } catch (error) {
    console.error('[Test MongoDB Config] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
