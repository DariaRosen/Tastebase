import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Try to read .env.local directly from filesystem
    const envPath = join(process.cwd(), '.env.local');
    
    let fileExists = false;
    let fileContent = '';
    let fileError = null;
    
    try {
      fileContent = readFileSync(envPath, 'utf-8');
      fileExists = true;
    } catch (error: any) {
      fileError = error.message;
    }
    
    // Check process.env
    const mongoUrlFromEnv = process.env.MONGO_URL;
    const dbNameFromEnv = process.env.DB_NAME;
    
    // Parse file content to find MONGO_URL (handle both \n and \r\n)
    let mongoUrlInFile = null;
    let dbNameInFile = null;
    if (fileContent) {
      const lines = fileContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        // Handle MONGO_URL=value format
        if (trimmed.startsWith('MONGO_URL=')) {
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            mongoUrlInFile = parts.slice(1).join('=').trim(); // Join in case = is in the value
          }
        }
        // Handle DB_NAME=value format
        if (trimmed.startsWith('DB_NAME=')) {
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            dbNameInFile = parts.slice(1).join('=').trim();
          }
        }
      }
    }
    
    return NextResponse.json({
      file: {
        exists: fileExists,
        path: envPath,
        error: fileError,
        hasContent: fileContent.length > 0,
        contentLength: fileContent.length,
        mongoUrlInFile: mongoUrlInFile ? `${mongoUrlInFile.substring(0, 30)}...` : 'NOT FOUND',
        dbNameInFile: dbNameInFile || 'NOT FOUND',
        allLines: fileContent.split(/\r?\n/).length,
      },
      processEnv: {
        MONGO_URL: mongoUrlFromEnv ? `${mongoUrlFromEnv.substring(0, 30)}...` : 'NOT SET',
        MONGO_URL_set: !!mongoUrlFromEnv,
        DB_NAME: dbNameFromEnv || 'NOT SET',
        DB_NAME_set: !!dbNameFromEnv,
      },
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

