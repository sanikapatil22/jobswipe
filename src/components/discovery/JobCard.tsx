'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, Calendar, MapPin, Sparkles } from 'lucide-react';
import { Job, UserProfile } from '@/types';

interface JobCardProps {
  job: Job;
  userProfile: UserProfile;
  compact?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  userProfile,
  compact = false,
}) => {
  const hasApplyUrl = Boolean(job.applyUrl?.trim());
  const postedDate = job.postedDate || job.deadline;
  const postedLabel = new Date(postedDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const snippet = job.description.length > 190 ? `${job.description.slice(0, 190).trimEnd()}…` : job.description;

  return (
    <div className={`w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-4xl shadow-[0_24px_90px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col relative select-none transition-all ${compact ? 'scale-[0.98]' : ''}`}>
      <div className="h-2.5 bg-indigo-600" />

      <div className={`${compact ? 'p-4' : 'p-5'} flex items-start justify-between gap-4 border-b border-slate-100`}>
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 p-1 flex items-center justify-center flex-none overflow-hidden shadow-sm">
            <Image
              src={job.companyLogo}
              alt={job.companyName}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-xl"
              unoptimized
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-black text-slate-900 text-base truncate">{job.companyName}</h3>
              {job.companySize && (
                <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  {job.companySize}
                </span>
              )}
            </div>
            <h2 className="font-black text-indigo-700 text-lg leading-snug mt-0.5 line-clamp-2">
              {job.role}
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-end flex-none">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{job.staticMatchScore}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Match</span>
        </div>
      </div>

      <div className={`${compact ? 'p-4' : 'p-5'} flex-1 space-y-4`}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800">
            <MapPin className="w-4 h-4 text-sky-600 flex-none" />
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-black">Location</p>
              <p className="font-extrabold text-slate-900 truncate">{job.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800">
            <Calendar className="w-4 h-4 text-amber-600 flex-none" />
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-black">Posted</p>
              <p className="font-extrabold text-slate-900 truncate">{postedLabel}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-4">
          {snippet}
        </p>

        <div className="flex flex-wrap gap-2">
          {job.tags.slice(0, 6).map((tag) => {
            const userHasSkill = userProfile.skills.some((skill) => skill.toLowerCase() === tag.toLowerCase());
            return (
              <span
                key={tag}
                className={`px-3 py-1 text-[11px] rounded-full font-bold border ${
                  userHasSkill
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {job.missingSkills && job.missingSkills.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            Focus prep on {job.missingSkills.join(', ')}.
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {hasApplyUrl ? (
          <button
            type="button"
            onClick={() => window.open(job.applyUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <span>Apply on Official Site</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400 border border-slate-200 cursor-not-allowed"
          >
            <span>Application unavailable</span>
          </button>
        )}
      </div>
    </div>
  );
};
