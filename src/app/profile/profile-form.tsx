'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  initialUsername?: string | null;
  initialFullName?: string | null;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
}

type Status = { type: 'idle' } | { type: 'success'; message: string } | { type: 'error'; message: string };

export const ProfileForm = ({
  initialUsername,
  initialFullName,
  initialBio,
  initialAvatarUrl,
}: ProfileFormProps) => {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername ?? '');
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [bio, setBio] = useState(initialBio ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(initialUsername ?? '');
    setFullName(initialFullName ?? '');
    setBio(initialBio ?? '');
    setAvatarPreview(initialAvatarUrl ?? null);
  }, [initialUsername, initialFullName, initialBio, initialAvatarUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Clean up previous blob URL if it exists
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleRemoveImage = () => {
    // Clean up blob URL if it exists
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(initialAvatarUrl ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: 'idle' });
    try {
      // Upload avatar to Cloudinary if a new file was selected
      let avatarUrl = initialAvatarUrl ?? null;
      if (avatarFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', avatarFile);

        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload avatar image.');
        }

        const { url } = await uploadResponse.json();
        avatarUrl = url;
        setAvatarPreview(url); // Update preview to show uploaded image
      }

      // Update profile via API
      const updateResponse = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || null,
          full_name: fullName || null,
          bio: bio || null,
          avatar_url: avatarUrl,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update profile.');
      }

      setStatus({ type: 'success', message: 'Profile updated successfully.' });
      setAvatarFile(null);

      setTimeout(() => {
        router.refresh();
        router.push('/');
      }, 1000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200 flex-shrink-0">
          {avatarPreview ? (
            <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">👩‍🍳</div>
          )}
        </div>
        <div className="flex-1">
          <label className="flex flex-col text-sm text-gray-700">
            <span className="font-medium">Avatar</span>
            <div className="mt-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-hover"
                />
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-500">Upload a JPG/PNG under 5MB. Optional.</span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <label className="flex flex-1 flex-col text-sm text-gray-700">
          <span className="font-medium">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cook123"
            maxLength={32}
            className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <span className="mt-1 text-xs text-gray-500">
            Lowercase letters, numbers, hyphens, and underscores only.
          </span>
        </label>

        <label className="flex flex-1 flex-col text-sm text-gray-700">
          <span className="font-medium">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>
      </div>

      <label className="flex flex-col text-sm text-gray-700">
        <span className="font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell us about yourself..."
          className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </label>

      {status.type === 'success' && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{status.message}</div>
      )}
      {status.type === 'error' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{status.message}</div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:opacity-60"
      >
        {isSaving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
};
