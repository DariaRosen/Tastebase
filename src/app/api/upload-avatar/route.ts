import { NextRequest, NextResponse } from 'next/server';

// Use process.env directly (works in both local and Vercel)
// In Vercel, environment variables are automatically injected into process.env
// Locally, Next.js loads them from .env.local automatically
function getCloudinaryConfig() {
  const cloudName = 
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    '';
  
  const uploadPreset = 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    '';
  
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  
  return { cloudName, uploadPreset, apiKey, apiSecret };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

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

    // Get Cloudinary credentials from environment variables
    const { cloudName, uploadPreset, apiKey, apiSecret } = getCloudinaryConfig();

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
        folder: 'Tastebase/avatars',
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
      uploadFormData.append('folder', 'Tastebase/avatars');
      
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
      uploadFormData.append('folder', 'Tastebase/avatars');
      
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

