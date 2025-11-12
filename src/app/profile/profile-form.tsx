'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';

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
	const [username, setUsername] = useState(initialUsername ?? '');
	const [fullName, setFullName] = useState(initialFullName ?? '');
	const [bio, setBio] = useState(initialBio ?? '');
	const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl ?? null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [status, setStatus] = useState<Status>({ type: 'idle' });

	useEffect(() => {
		setUsername(initialUsername ?? '');
		setFullName(initialFullName ?? '');
		setBio(initialBio ?? '');
		setAvatarPreview(initialAvatarUrl ?? null);
	}, [initialUsername, initialFullName, initialBio, initialAvatarUrl]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);
		const previewUrl = URL.createObjectURL(file);
		setAvatarPreview(previewUrl);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSaving(true);
		setStatus({ type: 'idle' });
		try {
			const supabase = createClient();
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				throw new Error('You must be signed in to update your profile.');
			}

			let avatarUrl = initialAvatarUrl ?? null;
			if (avatarFile) {
				const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
				const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
					cacheControl: '3600',
					upsert: true,
					contentType: avatarFile.type,
				});
				if (uploadError) {
					throw uploadError;
				}
				const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
				avatarUrl = publicUrlData.publicUrl;
			}

			const profilePayload = {
				id: user.id,
				username: username || null,
				full_name: fullName || null,
				bio: bio || null,
				avatar_url: avatarUrl,
			};

			const { error: upsertError } = await supabase.from('profiles').upsert(profilePayload).select().single();
			if (upsertError) {
				throw upsertError;
			}

			await supabase.auth.updateUser({
				data: {
					username: username || null,
					full_name: fullName || null,
					avatar_url: avatarUrl,
				},
			});

			setStatus({ type: 'success', message: 'Profile updated successfully.' });
			setAvatarFile(null);

			if (typeof window !== 'undefined') {
				setTimeout(() => {
					window.location.href = '/';
				}, 1000);
			}
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
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200">
					{avatarPreview ? (
						<Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
					) : (
						<div className="flex h-full w-full items-center justify-center text-3xl">👩‍🍳</div>
					)}
				</div>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Avatar</span>
					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className="mt-1 text-sm text-gray-600"
						aria-label="Upload avatar"
					/>
					<span className="text-xs text-gray-500">Use square JPG/PNG under 5MB for best results.</span>
				</label>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Username</span>
					<input
						id="username"
						name="username"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						placeholder="chef-amy"
						required
						minLength={3}
						maxLength={32}
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
					/>
				</label>
				<label className="flex flex-col text-sm text-gray-700">
					<span className="font-medium">Full name</span>
					<input
						id="fullName"
						name="fullName"
						value={fullName}
						onChange={(event) => setFullName(event.target.value)}
						placeholder="Amy Santiago"
						className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
					/>
				</label>
			</div>

			<label className="flex flex-col text-sm text-gray-700">
				<span className="font-medium">Bio</span>
				<textarea
					id="bio"
					name="bio"
					value={bio}
					onChange={(event) => setBio(event.target.value)}
					placeholder="Short intro about you..."
					rows={3}
					className="mt-1 rounded-lg border border-border-subtle px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
				/>
			</label>

			<button
				type="submit"
				disabled={isSaving}
				className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:opacity-60"
				aria-busy={isSaving}
			>
				{isSaving ? 'Saving…' : 'Save profile'}
			</button>

			{status.type === 'success' && <p className="text-sm text-green-600">{status.message}</p>}
			{status.type === 'error' && <p className="text-sm text-red-600">{status.message}</p>}
		</form>
	);
};


