import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabaseServer';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
	const supabase = await createServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('username, full_name, bio, avatar_url')
		.eq('id', user.id)
		.single();

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-10">
				<div className="mb-8 space-y-2">
					<h1 className="text-3xl font-bold text-gray-900">Edit profile</h1>
					<p className="text-gray-600">Update your public information and avatar.</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<ProfileForm
						initialUsername={profile?.username}
						initialFullName={profile?.full_name}
						initialBio={profile?.bio}
						initialAvatarUrl={profile?.avatar_url}
					/>
				</div>
			</div>
		</div>
	);
}


