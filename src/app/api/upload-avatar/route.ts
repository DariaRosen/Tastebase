import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary SDK (like the working Rolan-Photographer project)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

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

    // Check Cloudinary configuration
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in environment variables.' },
        { status: 500 }
      );
    }

    // Convert file to buffer for Cloudinary SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    try {
      // Use Cloudinary SDK for upload (like the working Rolan-Photographer project)
      let uploadResult;
      
      if (apiKey && apiSecret) {
        // Use signed upload with API credentials
        console.log('[Upload Avatar] Using Cloudinary SDK with API credentials');
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: 'Tastebase/avatars',
        });
      } else if (uploadPreset) {
        // Use unsigned upload with preset
        console.log('[Upload Avatar] Using Cloudinary SDK with upload preset');
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: 'Tastebase/avatars',
          upload_preset: uploadPreset,
        });
      } else {
        console.error('[Upload Avatar] Missing Cloudinary configuration');
        return NextResponse.json(
          { error: 'Cloudinary upload preset or API credentials not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in environment variables.' },
          { status: 500 }
        );
      }

      const imageUrl = uploadResult.secure_url;

    return NextResponse.json({ url: imageUrl });
    } catch (uploadError: any) {
      console.error('[Upload Avatar] Cloudinary upload error:', {
        message: uploadError?.message,
        http_code: uploadError?.http_code,
        error: uploadError?.error,
      });
      return NextResponse.json(
        { 
          error: 'Failed to upload image to Cloudinary',
          details: uploadError?.message || uploadError?.error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Upload Avatar] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

