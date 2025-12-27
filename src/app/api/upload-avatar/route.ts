import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

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
        { 
          error: 'Cloudinary cloud name not configured',
          details: 'Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    // Configure Cloudinary SDK at runtime (like the working Rolan-Photographer project)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey || '',
      api_secret: apiSecret || '',
    });

    // Convert file to buffer for Cloudinary SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to data URI format that Cloudinary accepts
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    try {
      // Use Cloudinary SDK for upload
      let uploadResult;
      
      if (apiKey && apiSecret) {
        // Use signed upload with API credentials
        console.log('[Upload Avatar] Using Cloudinary SDK with API credentials');
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: 'Tastebase/avatars',
          resource_type: 'image',
        });
      } else if (uploadPreset) {
        // Use unsigned upload with preset
        // Note: For unsigned uploads, folder must be set in the preset, not here
        console.log('[Upload Avatar] Using Cloudinary SDK with upload preset');
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          upload_preset: uploadPreset,
          resource_type: 'image',
          // Don't set folder for unsigned uploads - it must be in the preset
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
        name: uploadError?.name,
        stack: uploadError?.stack,
      });
      
      // Extract detailed error information
      let errorMessage = 'Failed to upload image to Cloudinary';
      let errorDetails = uploadError?.message || uploadError?.error?.message || 'Unknown error';
      
      // Provide more specific error messages
      if (uploadError?.http_code === 401) {
        errorMessage = 'Cloudinary authentication failed';
        errorDetails = 'Invalid API credentials. Please check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel environment variables.';
      } else if (uploadError?.http_code === 400) {
        errorMessage = 'Invalid upload request';
        errorDetails = uploadError?.error?.message || 'The image file may be invalid or corrupted.';
      } else if (uploadError?.message?.includes('Invalid preset')) {
        errorMessage = 'Invalid upload preset';
        errorDetails = 'The upload preset is not configured correctly. Please check NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in Vercel environment variables.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          http_code: uploadError?.http_code,
          cloudinaryError: process.env.NODE_ENV === 'development' ? {
            message: uploadError?.message,
            error: uploadError?.error,
            http_code: uploadError?.http_code,
          } : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Upload Avatar] Unexpected error:', error);
    console.error('[Upload Avatar] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

