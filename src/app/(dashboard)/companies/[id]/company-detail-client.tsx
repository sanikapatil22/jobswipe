'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CompanyPrepDetail } from '@/components/prep/CompanyPrepDetail';
import {
  enqueueInsights,
  enqueueRoadmap,
  getApplicationStatus,
  updateRoadmapTask,
} from '@/server/actions';
import type { Application, UserProfile } from '@/types';
import { useState } from 'react';

export function CompanyDetailClient({
  application: initial,
  userProfile,
}: {
  application: Application;
  userProfile: UserProfile;
}) {
  const router = useRouter();
  const [application, setApplication] = useState(initial);

  useQuery({
    queryKey: [
      'application',
      application.id,
      application.roadmapStatus,
      application.insightsStatus,
    ],
    enabled:
      application.roadmapStatus === 'GENERATING' ||
      application.insightsStatus === 'GENERATING',
    refetchInterval: 2500,
    queryFn: async () => {
      const updated = await getApplicationStatus(application.id);
      setApplication(updated);
      return updated;
    },
  });

  return (
    <CompanyPrepDetail
      application={application}
      userProfile={userProfile}
      onClose={() => router.push('/companies')}
      onGenerateRoadmap={async (appId) => {
        setApplication((prev) => ({
          ...prev,
          roadmapStatus: 'GENERATING',
          roadmapGenerating: true,
        }));
        await enqueueRoadmap(appId);
      }}
      onGenerateInsights={async (appId) => {
        setApplication((prev) => ({
          ...prev,
          insightsStatus: 'GENERATING',
          insightsGenerating: true,
        }));
        await enqueueInsights(appId);
      }}
      onUpdateTaskCompletion={async (appId, stepId, taskId, completed) => {
        const res = await updateRoadmapTask({
          applicationId: appId,
          stepId,
          taskId,
          completed,
        });
        if (res.roadmap) {
          setApplication((prev) => ({
            ...prev,
            roadmap: res.roadmap,
            roadmapStatus: 'READY',
          }));
        }
      }}
    />
  );
}
