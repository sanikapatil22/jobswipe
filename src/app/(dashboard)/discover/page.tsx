import { Suspense } from 'react';
import { requireSession } from '@/lib/session';
import { getJobsForUser, getProfileForUser } from '@/server/queries';
import { DISCOVER_PAGE_SIZE } from '@/server/jobs/discover';
import { DiscoverClient } from './discover-client';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const session = await requireSession();
  const [jobs, profile] = await Promise.all([
    getJobsForUser(session.user.id),
    getProfileForUser(session.user.id),
  ]);

  return (
    <Suspense fallback={null}>
      <DiscoverClient
        jobs={jobs.slice(0, DISCOVER_PAGE_SIZE)}
        userProfile={profile}
      />
    </Suspense>
  );
}
