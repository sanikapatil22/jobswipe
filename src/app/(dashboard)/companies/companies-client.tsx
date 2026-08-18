'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PrepView } from '@/components/prep/PrepView';
import {
  enqueueRoadmap,
  getApplicationStatus,
  updateApplicationStatus,
  updateApplicationMeta,
  updateRoadmapTask,
} from '@/server/actions';
import { useAppStore } from '@/store/app-store';
import type { Application, ApplicationStatus, UserProfile } from '@/types';

export function CompaniesClient({
  applications: initialApps,
  userProfile,
}: {
  applications: Application[];
  userProfile: UserProfile;
}) {
  const router = useRouter();
  const applications = useAppStore((s) => s.applications);
  const setApplications = useAppStore((s) => s.setApplications);
  const upsertApplication = useAppStore((s) => s.upsertApplication);
  const setRoadmapGenerating = useAppStore((s) => s.setRoadmapGenerating);

  useEffect(() => {
    setApplications(initialApps);
  }, [initialApps, setApplications]);

  const generatingIds = (applications.length ? applications : initialApps)
    .filter((a) => a.roadmapStatus === 'GENERATING')
    .map((a) => a.id);

  useQuery({
    queryKey: ['roadmap-poll', generatingIds],
    enabled: generatingIds.length > 0,
    refetchInterval: 2500,
    queryFn: async () => {
      const updates = await Promise.all(
        generatingIds.map((id) => getApplicationStatus(id))
      );
      updates.forEach((app) => upsertApplication(app));
      return updates;
    },
  });

  const apps = applications.length ? applications : initialApps;

  return (
    <PrepView
      applications={apps}
      userProfile={userProfile}
      onUpdateStatus={async (jobId, status: ApplicationStatus) => {
        const res = await updateApplicationStatus({ jobId, status });
        if (res.application) upsertApplication(res.application);
      }}
      onUpdateMeta={async (jobId, meta) => {
        const res = await updateApplicationMeta({ jobId, ...meta });
        if (res.application) upsertApplication(res.application);
      }}
      onGenerateRoadmap={async (appId) => {
        setRoadmapGenerating(appId);
        await enqueueRoadmap(appId);
        router.refresh();
      }}
      onUpdateTaskCompletion={async (appId, stepId, taskId, completed) => {
        const res = await updateRoadmapTask({
          applicationId: appId,
          stepId,
          taskId,
          completed,
        });
        const current = apps.find((a) => a.id === appId);
        if (current && res.roadmap) {
          upsertApplication({ ...current, roadmap: res.roadmap, roadmapStatus: 'READY' });
        }
      }}
      onOpenDetail={(appId) => router.push(`/companies/${appId}`)}
    />
  );
}
