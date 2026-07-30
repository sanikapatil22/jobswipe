import { requireSession } from '@/lib/session';
import { getProfileForUser } from '@/server/queries';
import { ResumeClient } from './resume-client';

export default async function ResumePage() {
  const session = await requireSession();
  const profile = await getProfileForUser(session.user.id);
  return <ResumeClient userProfile={profile} />;
}
