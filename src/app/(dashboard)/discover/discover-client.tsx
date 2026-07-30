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
  const setRoadmapGenerating = useAppStore((s) => s.setRoadmapGenerating);

  useEffect(() => {
    setJobs(jobs);
  }, [jobs, setJobs]);

  const onApplyJob = async (job: Job) => {
    const result = await handleSwipe({
      jobId: job.id,
      direction: 'right',
      generateRoadmap: true,
    });
    if (result.application) {
      upsertApplication(result.application);
      setRoadmapGenerating(result.application.id);
    }
  };

  const onSaveJob = async (job: Job) => {
    const result = await handleSwipe({ jobId: job.id, direction: 'save' });
    if (result.application) upsertApplication(result.application);
  };

  const onDiscardJob = async (job: Job) => {
    await handleSwipe({ jobId: job.id, direction: 'left' });
  };

  return (
    <DiscoveryView
      jobs={jobs}
      userProfile={userProfile}
      onApplyJob={onApplyJob}
      onSaveJob={onSaveJob}
      onDiscardJob={onDiscardJob}
    />
  );
}
