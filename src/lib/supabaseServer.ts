import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createServerSupabase = () => {
	const cookieStore = cookies();
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					// @ts-expect-error Next 15+ cookies can be awaited; runtime handles sync access too
					return cookieStore.get(name)?.value;
				},
			},
		}
	);
};


