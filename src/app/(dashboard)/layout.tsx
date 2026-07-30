import { requireSession } from '@/lib/session';
import { getApplicationsForUser, getProfileForUser } from '@/server/queries';
import { Navigation } from '@/components/Navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [profile, applications] = await Promise.all([
    getProfileForUser(session.user.id),
    getApplicationsForUser(session.user.id),
  ]);

  const appliedCount = applications.filter((a) => a.status !== 'DISCARDED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navigation userProfile={profile} appliedCount={appliedCount} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
