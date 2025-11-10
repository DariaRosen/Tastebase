'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [email, setEmail] = useState('');
	// Dev-only: no password in UI. We use a fixed password behind the scenes.
	const [username, setUsername] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const TEST_PASSWORD = 'tastebase-dev';

	const handleClose = () => {
		if (isLoading) return;
		onOpenChange(false);
		setTimeout(() => {
			setEmail('');
			setUsername('');
			setMessage(null);
			setError(null);
			setMode('login');
		}, 200);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage(null);
		setError(null);
		try {
			const supabase = createClient();
			if (mode === 'login') {
				// Try sign in; if it fails (user not found), auto-create then sign in
				const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD });
				if (signInError) {
					// Attempt to create the user silently for dev
					await supabase.auth
						.signUp({ email, password: TEST_PASSWORD, options: { emailRedirectTo: undefined } })
						.catch(() => {});
					const { error: secondTry } = await supabase.auth.signInWithPassword({
						email,
						password: TEST_PASSWORD,
					});
					if (secondTry) {
						setError(secondTry.message);
						setIsLoading(false);
						return;
					}
				}
				setMessage('Signed in.');
				onOpenChange(false);
			} else {
				const { error: signUpError } = await supabase.auth.signUp({ email, password: TEST_PASSWORD, options: { data: { username }, emailRedirectTo: undefined } });
				if (signUpError) {
					setError(signUpError.message);
				} else {
					await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD }).catch(() => {});
					setMessage('Account created. You are signed in.');
					onOpenChange(false);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsLoading(false);
		}
	};

	// DEV ONLY: email-only sign-in using a fixed password.
	const handleDevEmailOnly = async () => {
		setIsLoading(true);
		setMessage(null);
		setError(null);
		try {
			const supabase = createClient();
			// Try sign in first
			let { error: signInErr } = await supabase.auth.signInWithPassword({
				email,
				password: TEST_PASSWORD,
			});
			if (signInErr) {
				// If user doesn't exist, create then sign in
				const { error: signUpErr } = await supabase.auth.signUp({
					email,
					password: TEST_PASSWORD,
					options: { emailRedirectTo: undefined, data: {} },
				});
				if (signUpErr) {
					setError(signUpErr.message);
					setIsLoading(false);
					return;
				}
				// Try again
				const { error: signInErr2 } = await supabase.auth.signInWithPassword({
					email,
					password: TEST_PASSWORD,
				});
				if (signInErr2) {
					setError(signInErr2.message);
					setIsLoading(false);
					return;
				}
			}
			setMessage('Signed in (dev).');
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsLoading(false);
		}
	};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-24"
			role="dialog"
			aria-modal="true"
			aria-label="Sign in"
			onClick={handleClose}
		>
			<div
				className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
				onClick={(e) => e.stopPropagation()}
				role="document"
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">
						{mode === 'login' ? 'Log in' : 'Sign up'}
					</h2>
					<button
						type="button"
						onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
						className="text-sm font-medium text-orange-600 hover:underline"
						aria-label="Toggle auth mode"
					>
						{mode === 'login' ? 'Create account' : 'Have an account? Log in'}
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					{mode === 'signup' && (
						<label className="block">
							<span className="mb-1 block text-sm font-medium text-gray-700">Username</span>
							<input
								type="text"
								required
								minLength={3}
								maxLength={32}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
								placeholder="chefjane"
								aria-label="Username"
							/>
						</label>
					)}
					<label className="block">
						<span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoFocus
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
							placeholder="you@example.com"
							aria-label="Email address"
						/>
					</label>
					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
						aria-busy={isLoading}
						aria-disabled={isLoading}
					>
						{isLoading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
					</button>
					{message && <p className="text-sm text-green-600">{message}</p>}
					{error && <p className="text-sm text-red-600">{error}</p>}
				</form>
				<div className="my-4 h-px w-full bg-gray-200" />
				<p className="text-xs text-gray-500">
					Dev-only: no password field. A fixed password is used behind the scenes.
				</p>
				<button
					onClick={handleClose}
					className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
					aria-label="Close"
				>
					Close
				</button>
			</div>
		</div>
	);
};


