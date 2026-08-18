'use client';
import React, { useMemo, useState } from 'react';
import {
  Building2,
  Sparkles,
  ChevronRight,
  Star,
  CalendarClock,
  Trash2,
} from 'lucide-react';
import { Application, ApplicationStatus, UserProfile } from '@/types';
import { CompanyPrepDetail } from './CompanyPrepDetail';

interface PrepViewProps {
  applications: Application[];
  userProfile: UserProfile;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => void;
  onGenerateRoadmap: (appId: string) => Promise<void>;
  onUpdateTaskCompletion: (appId: string, stepId: string, taskId: string, completed: boolean) => void;
  onUpdateMeta: (jobId: string, meta: { favorite?: boolean; dueDate?: string | null }) => Promise<void> | void;
  onOpenDetail?: (appId: string) => void;
}

type DueTone = 'overdue' | 'today' | 'soon' | 'ok';

function dueInfo(dueDate?: string | null): { label: string; tone: DueTone } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `Overdue by ${-days}d`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days <= 3) return { label: `Due in ${days}d`, tone: 'soon' };
  return {
    label: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    tone: 'ok',
  };
}

export const PrepView: React.FC<PrepViewProps> = ({
  applications,
  userProfile,
  onUpdateStatus,
  onGenerateRoadmap,
  onUpdateTaskCompletion,
  onUpdateMeta,
  onOpenDetail,
}) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openDetail = (app: Application) => {
    if (onOpenDetail) {
      onOpenDetail(app.id);
      return;
    }
    setSelectedApp(app);
  };

  // Filter applications by status tab, favourites, and search
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (favoritesOnly && !app.favorite) return false;
    if (activeStatusTab === 'ALL') return true;
    return app.status === activeStatusTab;
  });

  const favCount = applications.filter((a) => a.favorite).length;

  // Due-date aware urgency buckets
  const isOverdue = (a: Application) => {
    const info = dueInfo(a.dueDate);
    return info?.tone === 'overdue' || info?.tone === 'today';
  };

  const urgentApps = filteredApps.filter(
    (a) => a.status === 'INTERVIEWING' || a.job.urgencyLevel === 'Tomorrow' || isOverdue(a)
  );
  const thisWeekApps = filteredApps.filter(
    (a) =>
      !isOverdue(a) &&
      a.status !== 'INTERVIEWING' &&
      (a.job.urgencyLevel === 'This Week' || dueInfo(a.dueDate)?.tone === 'soon')
  );
  const laterApps = filteredApps.filter(
    (a) =>
      !isOverdue(a) &&
      a.status !== 'INTERVIEWING' &&
      a.job.urgencyLevel !== 'Tomorrow' &&
      a.job.urgencyLevel !== 'This Week' &&
      dueInfo(a.dueDate)?.tone !== 'soon'
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0A0C12] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Companies & AI Prep Hub</h1>
            <span className="px-3 py-1 text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/30">
              {applications.length} SAVED & APPLIED
            </span>
            {favCount > 0 && (
              <span className="px-3 py-1 text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> {favCount} FAVOURITES
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Track application statuses, view AI-generated roadmaps, complete bite-sized tasks, and practice company-specific interview questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-100 border-2 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Interview Readiness: <strong>High</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.04] p-1.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs overflow-x-auto w-full sm:w-auto shadow-sm">
          {['ALL', 'INTERVIEWING', 'APPLIED', 'SAVED', 'OFFER', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatusTab(st)}
              className={`px-4 py-2 rounded-xl font-black transition-all text-xs whitespace-nowrap ${
                activeStatusTab === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`px-4 py-2 rounded-xl font-black transition-all text-xs whitespace-nowrap flex items-center gap-1.5 ${
              favoritesOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            Favourites
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-8 py-2.5 rounded-2xl bg-white dark:bg-white/[0.04] border-2 border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm"
          />
        </div>
      </div>

      {/* --- URGENCY BUCKET 1: URGENT / INTERVIEWING / OVERDUE --- */}
      {urgentApps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              🚨 High Urgency & Interviews Scheduled ({urgentApps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {urgentApps.map((app) => (
              <CompanyPrepCard
                key={app.id}
                application={app}
                onOpenDetail={() => openDetail(app)}
                onUpdateStatus={onUpdateStatus}
                onUpdateMeta={onUpdateMeta}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- URGENCY BUCKET 2: THIS WEEK --- */}
      {thisWeekApps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <h2 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              ⏳ Deadlines This Week ({thisWeekApps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {thisWeekApps.map((app) => (
              <CompanyPrepCard
                key={app.id}
                application={app}
                onOpenDetail={() => openDetail(app)}
                onUpdateStatus={onUpdateStatus}
                onUpdateMeta={onUpdateMeta}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- URGENCY BUCKET 3: LATER / ALL APPLICATIONS --- */}
      {laterApps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              📁 Applied & Saved ({laterApps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {laterApps.map((app) => (
              <CompanyPrepCard
                key={app.id}
                application={app}
                onOpenDetail={() => openDetail(app)}
                onUpdateStatus={onUpdateStatus}
                onUpdateMeta={onUpdateMeta}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="p-12 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            {favoritesOnly ? 'No Favourites Yet' : 'No Applications Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mb-4">
            {favoritesOnly
              ? 'Tap the star on a saved company to keep it in your favourites.'
              : 'Swipe right or apply to job cards in the Discover tab to add companies to your prep hub.'}
          </p>
          {favoritesOnly && (
            <button
              onClick={() => setFavoritesOnly(false)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all"
            >
              Show all applications
            </button>
          )}
        </div>
      )}

      {/* Level 3 Deep Work Prep Detail Modal */}
      {selectedApp && (
        <CompanyPrepDetail
          application={selectedApp}
          userProfile={userProfile}
          onClose={() => setSelectedApp(null)}
          onGenerateRoadmap={onGenerateRoadmap}
          onUpdateTaskCompletion={onUpdateTaskCompletion}
        />
      )}
    </div>
  );
};

// Sub-component: Individual Company Card in Grid
const CompanyPrepCard: React.FC<{
  application: Application;
  onOpenDetail: () => void;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => void;
  onUpdateMeta: (jobId: string, meta: { favorite?: boolean; dueDate?: string | null }) => void;
}> = ({ application, onOpenDetail, onUpdateStatus, onUpdateMeta }) => {
  const { job, roadmap, roadmapStatus } = application;
  const due = useMemo(() => dueInfo(application.dueDate), [application.dueDate]);

  // Calculate task completion
  let totalTasks = 0;
  let doneTasks = 0;
  if (roadmap) {
    roadmap.steps.forEach((s) =>
      s.tasks.forEach((t) => {
        totalTasks++;
        if (t.completed) doneTasks++;
      })
    );
  }
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const highlightClass =
    due?.tone === 'overdue' || due?.tone === 'today'
      ? 'border-rose-400 dark:border-rose-500/60 ring-2 ring-rose-200 dark:ring-rose-500/20'
      : due?.tone === 'soon'
        ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-200 dark:ring-amber-500/20'
        : 'border-slate-200 dark:border-white/10 hover:border-indigo-500';

  const dueBadgeClass =
    due?.tone === 'overdue'
      ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40'
      : due?.tone === 'today'
        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
        : due?.tone === 'soon'
          ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40'
          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/10';

  return (
    <div
      className={`p-6 rounded-3xl bg-white dark:bg-white/[0.03] border-2 shadow-sm transition-all flex flex-col justify-between space-y-4 ${highlightClass}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug truncate">
            {job.companyName}
          </h3>
          <p className="text-xs text-indigo-600 dark:text-indigo-300 font-extrabold line-clamp-1 mt-0.5">
            {job.role}
          </p>
          {roadmapStatus === 'GENERATING' && (
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wide">
              AI Roadmap Generating…
            </p>
          )}
          {roadmapStatus === 'FAILED' && (
            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 mt-1 uppercase tracking-wide">
              Roadmap Failed — Retry in Hub
            </p>
          )}
        </div>

        <div className="flex-none flex flex-col items-end gap-2">
          {/* Favourite toggle */}
          <button
            onClick={() => onUpdateMeta(job.id, { favorite: !application.favorite })}
            title={application.favorite ? 'Remove from favourites' : 'Add to favourites'}
            className={`p-2 rounded-xl border-2 transition-all ${
              application.favorite
                ? 'bg-amber-100 border-amber-300 text-amber-500 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-400'
                : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-300 dark:text-slate-500 hover:text-amber-500 hover:border-amber-300'
            }`}
          >
            <Star className={`w-4 h-4 ${application.favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Status Dropdown Picker */}
          <select
            value={application.status}
            onChange={(e) => onUpdateStatus(job.id, e.target.value as ApplicationStatus)}
            className={`px-3 py-1.5 text-xs font-black rounded-xl border-2 focus:outline-none cursor-pointer ${
              application.status === 'INTERVIEWING'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
                : application.status === 'APPLIED'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/40'
                  : application.status === 'OFFER'
                    ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/40'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/10'
            }`}
          >
            <option value="INTERVIEWING">INTERVIEWING</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SAVED">SAVED</option>
            <option value="OFFER">OFFER</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Due date row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-[10px] font-black ${dueBadgeClass} ${
            due?.tone === 'overdue' ? 'animate-pulse' : ''
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          {due ? due.label : 'No due date'}
        </span>
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="date"
            value={application.dueDate ? application.dueDate.slice(0, 10) : ''}
            onChange={(e) => onUpdateMeta(job.id, { dueDate: e.target.value || null })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border-2 border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600"
            title="Set a due date / deadline"
          />
          {application.dueDate && (
            <button
              onClick={() => onUpdateMeta(job.id, { dueDate: null })}
              title="Clear due date"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Salary & Location Info */}
      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium space-y-1">
        <p className="font-extrabold text-slate-900 dark:text-white">{job.salary}</p>
        <p>{job.location} • {job.workType}</p>
      </div>

      {/* Prep Completion Progress Bar */}
      <div className="space-y-2 pt-3 border-t-2 border-slate-100 dark:border-white/10">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span>AI Prep Tasks</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-black">{doneTasks}/{totalTasks} ({pct}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Action Button: Open AI Prep Hub */}
      <button
        onClick={onOpenDetail}
        className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all mt-auto shadow-md shadow-indigo-100 dark:shadow-none"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Open AI Prep Hub</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
