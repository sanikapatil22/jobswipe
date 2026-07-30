import { requireSession } from '@/lib/session';
import { getJobsForUser, getProfileForUser } from '@/server/queries';
import { DiscoverClient } from './discover-client';

export default async function DiscoverPage() {
  const session = await requireSession();
  const [jobs, profile] = await Promise.all([
    getJobsForUser(session.user.id),
    getProfileForUser(session.user.id),
  ]);

  return <DiscoverClient jobs={jobs} userProfile={profile} />;
}
