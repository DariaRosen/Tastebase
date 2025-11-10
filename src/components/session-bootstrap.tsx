import { createServerSupabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

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
		if (user) {
			// Try to persist username/full_name/avatar from user metadata on first run
			const username = (user.user_metadata as any)?.username as string | undefined;
			const full_name = (user.user_metadata as any)?.full_name as string | undefined;
			const avatar_url = (user.user_metadata as any)?.avatar_url as string | undefined;
			const row: Record<string, unknown> = { id: user.id };
			if (username) row.username = username;
			if (full_name) row.full_name = full_name;
			if (avatar_url) row.avatar_url = avatar_url;

			await supabase.from('profiles').upsert(row).select().single().catch(() => null);
		}
	} catch {
		// no-op: bootstrap must never block page render
	}

	return null;
}


