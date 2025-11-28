import { NextRequest, NextResponse } from 'next/server';

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
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in environment variables.' },
        { status: 500 }
      );
    }

    if (!uploadPreset) {
      return NextResponse.json(
        { error: 'Cloudinary upload preset not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in environment variables.' },
        { status: 500 }
      );
    }

    // TypeScript now knows uploadPreset is a string after the check above
    // Use type assertion to satisfy TypeScript
    const preset = uploadPreset as string;

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary using the preset
    // The preset (ml_default) is configured as "Signed" in Cloudinary,
    // which means it requires authentication but works from server-side
    const uploadFormData = new FormData();
    uploadFormData.append('file', dataUri);
    uploadFormData.append('upload_preset', preset);
    uploadFormData.append('folder', 'Tastebase/avatars'); // Save avatars in Tastebase folder

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

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

