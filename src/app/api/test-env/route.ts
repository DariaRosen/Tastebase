import { NextResponse } from 'next/server';

export async function GET() {
  // Check all environment variables
  const envVars = {
    MONGO_URL: process.env.MONGO_URL ? `${process.env.MONGO_URL.substring(0, 30)}...` : 'NOT SET',
    MONGO_URL_length: process.env.MONGO_URL ? process.env.MONGO_URL.length : 0,
    MONGO_URL_set: !!process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME || 'NOT SET',
    DB_NAME_set: !!process.env.DB_NAME,
    NODE_ENV: process.env.NODE_ENV,
    // Check if loaded from .env.local
    all_env_keys: Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB_')),
  };

  return NextResponse.json({
    message: 'Environment variables check',
    env: envVars,
    note: 'If MONGO_URL is NOT SET, make sure .env.local exists and server was restarted',
  });
}
