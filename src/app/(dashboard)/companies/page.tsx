import { requireSession } from '@/lib/session';
import { getApplicationsForUser, getProfileForUser } from '@/server/queries';
import { CompaniesClient } from './companies-client';

export default async function CompaniesPage() {
  const session = await requireSession();
  const [applications, profile] = await Promise.all([
    getApplicationsForUser(session.user.id),
    getProfileForUser(session.user.id),
  ]);

  return <CompaniesClient applications={applications} userProfile={profile} />;
}
