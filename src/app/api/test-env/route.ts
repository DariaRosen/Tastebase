import { NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Manually load environment variables (workaround for Turbopack issue)
try {
  const envLocalPath = resolve(process.cwd(), '.env.local');
  const envPath = resolve(process.cwd(), '.env');
  
  config({ path: envLocalPath, override: false });
  config({ path: envPath, override: false });
  
  // Manual fallback parsing
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    try {
      const envContent = readFileSync(envLocalPath, 'utf8');
      envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
    } catch (e) {
      console.error('Manual parse error:', e);
    }
  }
} catch (e) {
  console.error('Env load error:', e);
}

export async function GET() {
  const allEnv = Object.keys(process.env)
    .filter(k => k.includes('CLOUDINARY') || k.includes('SUPABASE'))
    .reduce((acc, key) => {
      acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 10)}...` : 'NOT SET';
      return acc;
    }, {} as Record<string, string>);

  return NextResponse.json({
    message: 'Environment variables check',
    cloudinary: {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'NOT SET',
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'NOT SET',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    },
    allRelevantEnv: allEnv,
    cwd: process.cwd(),
  });
}

