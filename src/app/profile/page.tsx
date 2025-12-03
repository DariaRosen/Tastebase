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
    <div className="min-h-screen bg-brand-cream-soft">
      <Header />
      <div className="container mx-auto px-4 pb-10 pt-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-secondary">Edit profile</h1>
            <p className="text-gray-600">Update your public information and avatar.</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-white p-6 shadow-sm">
            <ProfileForm
              initialUsername={profile?.username ?? undefined}
              initialFullName={profile?.full_name ?? undefined}
              initialBio={profile?.bio ?? undefined}
              initialAvatarUrl={profile?.avatar_url ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
