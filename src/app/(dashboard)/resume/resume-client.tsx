'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResumeView } from '@/components/resume/ResumeView';
import { enqueueResumeParse, getResumeParseJobStatus, updateProfile } from '@/server/actions';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

export function ResumeClient({ userProfile: initial }: { userProfile: UserProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [parseJobId, setParseJobId] = useState<string | null>(null);

  useQuery({
    queryKey: ['resume-parse', parseJobId],
    enabled: !!parseJobId,
    refetchInterval: 2000,
    queryFn: async () => {
      if (!parseJobId) return null;
      const status = await getResumeParseJobStatus(parseJobId);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        setParseJobId(null);
        router.refresh();
        if (status.status === 'COMPLETED' && status.result) {
          const r = status.result as Record<string, unknown>;
          setProfile((prev) => ({
            ...prev,
            university: (r.university as string) || prev.university,
            graduationYear: (r.graduationYear as string) || prev.graduationYear,
            gpa: (r.gpa as string) || prev.gpa,
            skills: (r.skills as string[]) || prev.skills,
            targetRoles: (r.targetRoles as string[]) || prev.targetRoles,
            parsedSummary: (r.parsedSummary as string) || prev.parsedSummary,
            atsScore: (r.atsScore as number) || prev.atsScore,
            experiences: (r.experiences as UserProfile['experiences']) || prev.experiences,
          }));
        }
      }
      return status;
    },
  });

  return (
    <ResumeView
      userProfile={profile}
      isParsing={!!parseJobId}
      onUpdateProfile={async (partial) => {
        setProfile((prev) => ({ ...prev, ...partial }));
        await updateProfile(partial);
      }}
      onEnqueueParse={async ({ resumeText, resumeUrl }) => {
        const res = await enqueueResumeParse({ resumeText, resumeUrl });
        setParseJobId(res.jobId);
      }}
    />
  );
}
