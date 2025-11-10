'use server';

import { createServerSupabase } from '@/lib/supabaseServer';

export default async function SessionBootstrap() {
	const supabase = await createServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		// Ensure profile exists
		await supabase.from('profiles').upsert({ id: user.id }).select().single().catch(() => null);
	}

	return null;
}


