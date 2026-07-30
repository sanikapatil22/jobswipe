import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getApplicationById, getProfileForUser } from '@/server/queries';
import { CompanyDetailClient } from './company-detail-client';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [application, profile] = await Promise.all([
    getApplicationById(session.user.id, id),
    getProfileForUser(session.user.id),
  ]);

  if (!application) notFound();

  return <CompanyDetailClient application={application} userProfile={profile} />;
}
