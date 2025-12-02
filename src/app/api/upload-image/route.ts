import { NextRequest, NextResponse } from 'next/server';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Module-level cache for environment variables (workaround for Turbopack issue)
let cloudinaryConfig: { cloudName: string; uploadPreset: string; apiKey: string; apiSecret: string } | null = null;

function loadCloudinaryConfig() {
  if (cloudinaryConfig) return cloudinaryConfig;

  try {
    const envLocalPath = resolve(process.cwd(), '.env.local');
    // Read as buffer first to detect encoding
    const buffer = readFileSync(envLocalPath);
    
    // Check if it's UTF-16 (has null bytes between characters)
    let envContent: string;
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      // UTF-16 LE BOM
      envContent = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      // UTF-16 BE BOM
      const swapped = Buffer.alloc(buffer.length);
      for (let i = 0; i < buffer.length - 1; i += 2) {
        swapped[i] = buffer[i + 1];
        swapped[i + 1] = buffer[i];
      }
      envContent = swapped.toString('utf16le');
    } else {
      // Try UTF-8 first
      envContent = buffer.toString('utf8');
      // If it has null bytes between characters, it's likely UTF-16 without BOM
      if (envContent.includes('\0') && buffer.length > 0 && buffer[1] === 0) {
        envContent = buffer.toString('utf16le');
      }
    }
    
    // Remove BOM if present
    if (envContent.charCodeAt(0) === 0xFEFF) {
      envContent = envContent.slice(1);
    }
    
    const lines = envContent.split(/\r?\n/);
    let cloudName = '';
    let uploadPreset = '';
    let apiKey = '';
    let apiSecret = '';
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          let key = trimmed.substring(0, equalIndex).trim();
          // Remove all null bytes and non-printable characters
          key = key.replace(/\0/g, '').replace(/[^\x20-\x7E]/g, '');
          let value = trimmed.substring(equalIndex + 1).trim();
          // Remove all null bytes and non-printable characters from value
          value = value.replace(/\0/g, '').replace(/[^\x20-\x7E]/g, '');
          
          // Match using cleaned key
          if (key.includes('CLOUDINARY') && key.includes('CLOUD_NAME')) {
            cloudName = value;
          }
          if (key.includes('CLOUDINARY') && key.includes('UPLOAD_PRESET')) {
            uploadPreset = value;
          }
          if (key === 'CLOUDINARY_API_KEY' || (key.includes('CLOUDINARY') && key.includes('API_KEY') && !key.includes('SECRET'))) {
            apiKey = value;
          }
          if (key === 'CLOUDINARY_API_SECRET' || (key.includes('CLOUDINARY') && key.includes('API_SECRET'))) {
            apiSecret = value;
          }
        }
      }
    });
    
    cloudinaryConfig = { cloudName, uploadPreset, apiKey, apiSecret };
    return cloudinaryConfig;
  } catch (e) {
    console.error('Failed to load Cloudinary config:', e);
    cloudinaryConfig = { cloudName: '', uploadPreset: '', apiKey: '', apiSecret: '' };
    return cloudinaryConfig;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null) || 'Tastebase';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be 5MB or smaller' }, { status: 400 });
    }

    // Get Cloudinary credentials from our module-level cache
    const { cloudName, uploadPreset, apiKey, apiSecret } = loadCloudinaryConfig();

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in environment variables.' },
        { status: 500 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Try signed upload first (if API credentials are available), otherwise use unsigned preset
    let cloudinaryResponse: Response;
    
    if (apiKey && apiSecret) {
      // Use signed upload with API credentials (no preset needed)
      const timestamp = Math.round(new Date().getTime() / 1000);
      const crypto = await import('crypto');
      const params = {
        folder: folder,
        timestamp: timestamp.toString(),
      };
      // Create signature from sorted parameters
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key as keyof typeof params]}`)
        .join('&');
      const signature = crypto.createHash('sha1')
        .update(paramString + apiSecret)
        .digest('hex');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', dataUri);
      uploadFormData.append('api_key', apiKey);
      uploadFormData.append('timestamp', timestamp.toString());
      uploadFormData.append('signature', signature);
      uploadFormData.append('folder', folder);
      
      cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      );
    } else if (uploadPreset) {
      // Use unsigned upload with preset
      const uploadFormData = new FormData();
      uploadFormData.append('file', dataUri);
      uploadFormData.append('upload_preset', uploadPreset);
      uploadFormData.append('folder', folder);
      
      cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      );
    } else {
      return NextResponse.json(
        { error: 'Cloudinary upload preset or API credentials not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in environment variables.' },
        { status: 500 }
      );
    }

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to Cloudinary' },
        { status: 500 }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    const imageUrl = cloudinaryData.secure_url;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

