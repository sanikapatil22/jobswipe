'use client';

import { DiscoveryView } from '@/components/discovery/DiscoveryView';
import { handleSwipe } from '@/server/actions';
import { useAppStore } from '@/store/app-store';
import type { Job, UserProfile } from '@/types';
import { useEffect } from 'react';

export function DiscoverClient({
  jobs,
  userProfile,
}: {
  jobs: Job[];
  userProfile: UserProfile;
}) {
  const setJobs = useAppStore((s) => s.setJobs);
  const upsertApplication = useAppStore((s) => s.upsertApplication);

  useEffect(() => {
    setJobs(jobs);
  }, [jobs, setJobs]);

  const onInterestedJob = async (job: Job) => {
    const result = await handleSwipe({
      jobId: job.id,
      direction: 'right',
    });
    if (result.application) {
      upsertApplication(result.application);
    }
  };

  const onPassJob = async (job: Job) => {
    await handleSwipe({ jobId: job.id, direction: 'left' });
  };

  return (
    <DiscoveryView
      jobs={jobs}
      userProfile={userProfile}
      onInterestedJob={onInterestedJob}
      onPassJob={onPassJob}
    />
  );
}
