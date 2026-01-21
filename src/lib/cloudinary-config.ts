/**
 * Cloudinary configuration
 * This file helps ensure environment variables are properly loaded
 */

export const getCloudinaryConfig = () => {
  // Try multiple ways to access the env vars
  const cloudName = 
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    (typeof window !== 'undefined' ? (window as any).__CLOUDINARY_CLOUD_NAME__ : undefined);

  const uploadPreset = 
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    (typeof window !== 'undefined' ? (window as any).__CLOUDINARY_UPLOAD_PRESET__ : undefined);

  return {
    cloudName: cloudName || '',
    uploadPreset: uploadPreset || '',
  };
};



