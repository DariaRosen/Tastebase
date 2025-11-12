'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function AuthCallbackPage() {
	const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
	const [message, setMessage] = useState<string>('Finishing sign-in…');
	const closedRef = useRef(false);

	useEffect(() => {
		const supabase = createClient();
		(async () => {
			try {
				const params = new URLSearchParams(window.location.search);
				const code = params.get('code');
				if (!code) {
					setStatus('error');
					setMessage('Missing authorization code.');
					return;
				}

				const { error } = await supabase.auth.exchangeCodeForSession(code);
				if (error) {
					setStatus('error');
					setMessage(error.message);
					return;
				}
				setStatus('ok');
				setMessage('Signed in successfully.');
				// Try to close if this tab was opened as a popup and has an opener
				if (window.opener) {
					try {
						window.opener.postMessage({ type: 'tastebase-auth-signed-in' }, window.location.origin);
					} catch {}
					closedRef.current = true;
					window.close();
				}
			} catch (err) {
				setStatus('error');
				setMessage(err instanceof Error ? err.message : String(err));
			}
		})();
	}, []);

	useEffect(() => {
		// As a fallback, redirect home after a short delay
		if (status === 'ok' && !closedRef.current) {
			const t = setTimeout(() => {
				window.location.replace('/');
			}, 800);
			return () => clearTimeout(t);
		}
	}, [status]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow">
				<h1 className="mb-2 text-xl font-semibold text-gray-900">Tastebase</h1>
				<p className="text-sm text-gray-600">{message}</p>
				{status === 'error' && (
					<div className="mt-4">
						<Link href="/" className="text-sm font-medium text-brand-primary hover:underline">
							Go back home
						</Link>
					</div>
				)}
			</div>
		</main>
	);
}


