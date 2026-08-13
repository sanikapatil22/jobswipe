'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, Calendar, MapPin, Sparkles } from 'lucide-react';
import { Job, UserProfile } from '@/types';

interface JobCardProps {
  job: Job;
  userProfile: UserProfile;
  compact?: boolean;
  /** Portrait variant for the swipe deck: larger hero, more generous padding. */
  vertical?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  userProfile,
  compact = false,
  vertical = false,
}) => {
  const hasApplyUrl = Boolean(job.applyUrl?.trim());
  const postedDate = job.postedDate || job.deadline;
  // Fixed locale so the server and client render the exact same string (no hydration mismatch).
  const postedLabel = new Date(postedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  // Strip HTML tags + decode common entities (server-safe; no DOMParser for SSR).
  const cleanDescription = job.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  const snippet = cleanDescription.length > 190 ? `${cleanDescription.slice(0, 190).trimEnd()}…` : cleanDescription;

  const pad = vertical ? 'p-5 sm:p-6' : compact ? 'p-4' : 'p-5';
  const logoSize = vertical ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12';
  const logoRound = vertical ? 'rounded-3xl' : 'rounded-2xl';
  const imgSize = vertical ? 80 : 48;

  return (
    <div className={`w-full ${vertical ? 'max-w-none' : 'max-w-2xl'} mx-auto max-h-full bg-white border border-slate-200 rounded-4xl shadow-[0_24px_90px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col relative select-none transition-all ${compact ? 'scale-[0.98]' : ''}`}>
      <div className="h-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />

      <div className={`${pad} flex items-start justify-between gap-4 border-b border-slate-100`}>
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`${logoSize} rounded-2xl bg-slate-900 p-1 flex items-center justify-center flex-none overflow-hidden shadow-sm`}>
            <Image
              src={job.companyLogo}
              alt={job.companyName}
              width={imgSize}
              height={imgSize}
              className={`w-full h-full object-cover ${logoRound}`}
              unoptimized
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-black text-slate-900 truncate ${vertical ? 'text-lg' : 'text-base'}`}>
                {job.companyName}
              </h3>
              {job.companySize && (
                <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  {job.companySize}
                </span>
              )}
            </div>
            <h2 className={`font-black text-indigo-700 leading-snug mt-0.5 line-clamp-2 ${vertical ? 'text-xl sm:text-2xl lg:text-[26px]' : 'text-lg'}`}>
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

      <div className={`${pad} flex-1 min-h-0 overflow-y-auto space-y-4 [scrollbar-width:thin] [scrollbar-color:rgb(226_232_240)_transparent]`}>
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

        <p className={`text-sm text-slate-700 leading-relaxed font-medium ${vertical ? 'line-clamp-5' : 'line-clamp-4'}`}>
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
