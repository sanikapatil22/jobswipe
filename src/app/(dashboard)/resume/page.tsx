import { requireSession } from '@/lib/session';
import { getApplicationsForUser, getProfileForUser } from '@/server/queries';
import { ResumeClient } from './resume-client';

export default async function ResumePage() {
  const session = await requireSession();
  const [profile, applications] = await Promise.all([
    getProfileForUser(session.user.id),
    getApplicationsForUser(session.user.id),
  ]);
  return <ResumeClient userProfile={profile} applications={applications} />;
}
