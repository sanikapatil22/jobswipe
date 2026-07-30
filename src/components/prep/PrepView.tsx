'use client';
import React, { useState } from 'react';
import { 
  Building2, Sparkles, ChevronRight
} from 'lucide-react';
import { Application, ApplicationStatus, UserProfile } from '@/types';
import { CompanyPrepDetail } from './CompanyPrepDetail';

interface PrepViewProps {
  applications: Application[];
  userProfile: UserProfile;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => void;
  onGenerateRoadmap: (appId: string) => Promise<void>;
  onUpdateTaskCompletion: (appId: string, stepId: string, taskId: string, completed: boolean) => void;
  onOpenDetail?: (appId: string) => void;
}

export const PrepView: React.FC<PrepViewProps> = ({
  applications,
  userProfile,
  onUpdateStatus,
  onGenerateRoadmap,
  onUpdateTaskCompletion,
  onOpenDetail,
}) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const openDetail = (app: Application) => {
    if (onOpenDetail) {
      onOpenDetail(app.id);
      return;
    }
    setSelectedApp(app);
  };

  // Filter applications by status tab and search
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeStatusTab === 'ALL') return true;
    return app.status === activeStatusTab;
  });

  // Group into Urgency Buckets
  const urgentApps = filteredApps.filter(
    (a) => a.status === 'INTERVIEWING' || a.job.urgencyLevel === 'Tomorrow'
  );
  const thisWeekApps = filteredApps.filter(
    (a) => a.status !== 'INTERVIEWING' && a.job.urgencyLevel === 'This Week'
  );
  const laterApps = filteredApps.filter(
    (a) =>
      a.status !== 'INTERVIEWING' &&
      a.job.urgencyLevel !== 'Tomorrow' &&
      a.job.urgencyLevel !== 'This Week'
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-slate-900">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">My Companies & AI Prep Hub</h1>
            <span className="px-3 py-1 text-xs font-black bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
              {applications.length} SAVED & APPLIED
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl">
            Track application statuses, view AI-generated roadmaps, complete bite-sized tasks, and practice company-specific interview questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-100 border-2 border-emerald-200 text-xs font-black text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Interview Readiness: <strong>High</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-slate-200 text-xs overflow-x-auto w-full sm:w-auto shadow-sm">
          {['ALL', 'INTERVIEWING', 'APPLIED', 'SAVED', 'OFFER', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatusTab(st)}
              className={`px-4 py-2 rounded-xl font-black transition-all text-xs ${
                activeStatusTab === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-8 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm"
          />
        </div>

      </div>

      {/* --- URGENCY BUCKET 1: URGENT / INTERVIEWING --- */}
      {urgentApps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xs font-black text-rose-600 uppercase tracking-widest">
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
            <h2 className="text-xs font-black text-amber-700 uppercase tracking-widest">
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
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="p-12 rounded-3xl bg-white border-2 border-slate-200 text-center flex flex-col items-center justify-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-base font-black text-slate-900 mb-1">No Applications Found</h3>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mb-4">
            Swipe right or apply to job cards in the Discover tab to add companies to your prep hub.
          </p>
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
}> = ({ application, onOpenDetail, onUpdateStatus }) => {
  const { job, roadmap, roadmapStatus } = application;

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

  return (
    <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-500 shadow-sm transition-all flex flex-col justify-between space-y-4">
      
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 text-base leading-snug">{job.companyName}</h3>
          <p className="text-xs text-indigo-600 font-extrabold line-clamp-1 mt-0.5">{job.role}</p>
          {roadmapStatus === 'GENERATING' && (
            <p className="text-[10px] font-black text-amber-600 mt-1 uppercase tracking-wide">
              AI Roadmap Generating…
            </p>
          )}
          {roadmapStatus === 'FAILED' && (
            <p className="text-[10px] font-black text-rose-600 mt-1 uppercase tracking-wide">
              Roadmap Failed — Retry in Hub
            </p>
          )}
        </div>

        {/* Status Dropdown Picker */}
        <select
          value={application.status}
          onChange={(e) => onUpdateStatus(job.id, e.target.value as ApplicationStatus)}
          className={`px-3 py-1.5 text-xs font-black rounded-xl border-2 focus:outline-none cursor-pointer ${
            application.status === 'INTERVIEWING'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : application.status === 'APPLIED'
              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
              : application.status === 'OFFER'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <option value="INTERVIEWING">INTERVIEWING</option>
          <option value="APPLIED">APPLIED</option>
          <option value="SAVED">SAVED</option>
          <option value="OFFER">OFFER</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Salary & Location Info */}
      <div className="text-xs text-slate-600 font-medium space-y-1">
        <p className="font-extrabold text-slate-900">{job.salary}</p>
        <p>{job.location} • {job.workType}</p>
      </div>

      {/* Prep Completion Progress Bar */}
      <div className="space-y-2 pt-3 border-t-2 border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>AI Prep Tasks</span>
          <span className="text-emerald-700 font-black">{doneTasks}/{totalTasks} ({pct}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Action Button: Open AI Prep Hub */}
      <button
        onClick={onOpenDetail}
        className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all mt-auto shadow-md shadow-indigo-100"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Open AI Prep Hub</span>
        <ChevronRight className="w-4 h-4" />
      </button>

    </div>
  );
};
