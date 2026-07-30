import { requireSession } from '@/lib/session';
import { getProfileForUser } from '@/server/queries';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await getProfileForUser(session.user.id);
  return <ProfileClient userProfile={profile} />;
}
