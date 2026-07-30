'use client';

import { useState } from 'react';
import { ProfileView } from '@/components/profile/ProfileView';
import { updateProfile } from '@/server/actions';
import { authClient } from '@/lib/auth-client';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

export function ProfileClient({ userProfile: initial }: { userProfile: UserProfile }) {
  const [profile, setProfile] = useState(initial);
  const router = useRouter();

  return (
    <div>
      <ProfileView
        userProfile={profile}
        onUpdateProfile={async (partial) => {
          setProfile((prev) => ({ ...prev, ...partial }));
          await updateProfile(partial);
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <button
          onClick={async () => {
            await authClient.signOut();
            router.push('/login');
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-400 text-rose-700 font-black text-xs transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
