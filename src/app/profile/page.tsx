import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { ProfileForm } from './profile-form';
import { getCurrentUser } from '@/lib/auth-service';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  await connectDB();
  const profile = await User.findById(user.id).lean().exec();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Edit profile</h1>
          <p className="text-gray-600">Update your public information and avatar.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ProfileForm
            initialUsername={profile?.username ?? undefined}
            initialFullName={profile?.full_name ?? undefined}
            initialBio={profile?.bio ?? undefined}
            initialAvatarUrl={profile?.avatar_url ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
