import { createServerSupabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

const sanitizeUsername = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 32);

const baseUsernameFromEmail = (email: string | undefined | null) => {
	if (!email) return '';
	const [localPart] = email.split('@');
	return sanitizeUsername(localPart ?? '');
};

export default async function SessionBootstrap() {
	try {
		// Skip if there are no Supabase auth cookies to avoid unnecessary server work
		const cookieStore = await cookies();
		const hasSupabaseSession = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));
		if (!hasSupabaseSession) {
			return null;
		}

		const supabase = await createServerSupabase();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return null;

		const { data: profileRow } = await supabase
			.from('profiles')
			.select('username, full_name')
			.eq('id', user.id)
			.maybeSingle();

		const metadataUsername = sanitizeUsername(
			((user.user_metadata as any)?.username as string | undefined) ?? ''
		);
		const metadataFullName = ((user.user_metadata as any)?.full_name as string | undefined)?.trim();
		const avatarUrl = (user.user_metadata as any)?.avatar_url as string | undefined;

		const ensureUniqueUsername = async (base: string) => {
			let candidate = base || baseUsernameFromEmail(user.email) || `cook-${user.id.slice(0, 6)}`;
			candidate = sanitizeUsername(candidate);
			let suffix = 1;
			while (true) {
				const { data: existing } = await supabase
					.from('profiles')
					.select('id')
					.eq('username', candidate)
					.maybeSingle();
				if (!existing || existing.id === user.id) {
					return candidate;
				}
				const suffixStr = `-${suffix}`;
				const trimmedBase = candidate.slice(0, Math.max(0, 32 - suffixStr.length));
				candidate = `${trimmedBase}${suffixStr}`;
				suffix += 1;
			}
		};

		const row: Record<string, unknown> = { id: user.id };

		let finalUsername = profileRow?.username ?? null;
		if (!finalUsername) {
			const desired = metadataUsername || baseUsernameFromEmail(user.email);
			finalUsername = await ensureUniqueUsername(desired);
			row.username = finalUsername;
		}

		if (!profileRow?.full_name) {
			row.full_name = metadataFullName || finalUsername || user.email || 'Tastebase cook';
		}

		if (avatarUrl) {
			row.avatar_url = avatarUrl;
		}

		if (Object.keys(row).length > 1) {
			const { error: profileError } = await supabase.from('profiles').upsert(row);
			if (profileError) {
				console.warn('[SessionBootstrap] failed to upsert profile', profileError);
			}
		}
	} catch {
		// no-op: bootstrap must never block page render
	}

	return null;
}

