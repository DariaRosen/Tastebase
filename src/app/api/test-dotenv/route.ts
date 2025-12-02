import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to load dotenv manually
    const dotenv = require('dotenv');
    const path = require('path');
    const fs = require('fs');
    
    const envPath = path.join(process.cwd(), '.env.local');
    const fileExists = fs.existsSync(envPath);
    
    let result = null;
    let fileContent = '';
    
    if (fileExists) {
      fileContent = fs.readFileSync(envPath, 'utf-8');
      result = dotenv.config({ path: envPath });
    }
    
    return NextResponse.json({
      fileExists,
      envPath,
      fileContentLength: fileContent.length,
      dotenvResult: result ? {
        error: result.error?.message || null,
        parsed: result.parsed ? Object.keys(result.parsed) : null,
        MONGO_URL_in_parsed: result.parsed?.MONGO_URL ? `${result.parsed.MONGO_URL.substring(0, 30)}...` : 'NOT FOUND',
        DB_NAME_in_parsed: result.parsed?.DB_NAME || 'NOT FOUND',
      } : null,
      processEnvAfter: {
        MONGO_URL: process.env.MONGO_URL ? `${process.env.MONGO_URL.substring(0, 30)}...` : 'NOT SET',
        DB_NAME: process.env.DB_NAME || 'NOT SET',
      },
      fileContentPreview: fileContent.substring(0, 200),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

