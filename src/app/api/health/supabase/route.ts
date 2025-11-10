import { createServerSupabase } from '@/lib/supabaseServer';

export async function GET() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const keyPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

	const supabase = await createServerSupabase();

	let canConnect = false;
	let errorMessage: string | null = null;

	try {
		// Lightweight check: head-count on profiles to validate auth+DB connectivity.
		const { error } = await supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true });

		if (!error) {
			canConnect = true;
		} else {
			errorMessage = error.message ?? 'Unknown error';
		}
	} catch (err) {
		errorMessage = err instanceof Error ? err.message : String(err);
	}

	return Response.json({
		ok: canConnect,
		url,
		anonKeyPresent: keyPresent,
		error: errorMessage,
	});
}


