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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C12] text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors">
      <Navigation userProfile={profile} appliedCount={appliedCount} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
