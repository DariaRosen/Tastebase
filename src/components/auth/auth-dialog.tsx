'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface AuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleClose = () => {
		if (isLoading) return;
		onOpenChange(false);
		setTimeout(() => {
			setEmail('');
			setMessage(null);
			setError(null);
		}, 200);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage(null);
		setError(null);
		try {
			const supabase = createClient();
			const { error: signInError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
				},
			});
			if (signInError) {
				setError(signInError.message);
			} else {
				setMessage('Check your email for the sign-in link.');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsLoading(false);
		}
	};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Sign in"
			onClick={handleClose}
			onKeyDown={(e) => {
				if (e.key === 'Escape') handleClose();
			}}
			tabIndex={0}
		>
			<div
				className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
				onClick={(e) => e.stopPropagation()}
				role="document"
			>
				<div className="mb-4">
					<h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
					<p className="text-sm text-gray-600">We’ll send a magic link to your email.</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<label className="block">
						<span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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
						{isLoading ? 'Sending…' : 'Send magic link'}
					</button>
					{message && <p className="text-sm text-green-600">{message}</p>}
					{error && <p className="text-sm text-red-600">{error}</p>}
				</form>
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


