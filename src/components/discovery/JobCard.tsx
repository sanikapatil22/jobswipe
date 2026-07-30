'use client';
import React, { useState } from 'react';
import { 
  Building2, MapPin, DollarSign, Calendar, Sparkles, CheckCircle, 
  ExternalLink, RotateCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Job, UserProfile } from '@/types';

interface JobCardProps {
  job: Job;
  userProfile: UserProfile;
  isFront: boolean;
  onApply: (job: Job) => void;
  onSave: (job: Job) => void;
  onDiscard: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  userProfile,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Compute Days remaining to deadline
  const deadlineDate = new Date(job.deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

  return (
    <div className="w-full max-w-md mx-auto bg-white border-4 border-slate-900 rounded-[36px] shadow-2xl overflow-hidden flex flex-col h-[580px] relative select-none transition-all">
      
      {/* Top Banner Accent */}
      <div className="h-2.5 flex-none bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

      {/* Card Content Header */}
      <div className="p-5 border-b-2 border-slate-100 bg-white flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-slate-900 p-1 flex items-center justify-center flex-none overflow-hidden shadow-sm">
            <img 
              src={job.companyLogo} 
              alt={job.companyName} 
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Building2 className="w-6 h-6 text-white absolute" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base leading-snug">{job.companyName}</h3>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {job.companySize}
              </span>
            </div>
            <h2 className="font-black text-indigo-600 text-lg leading-snug mt-0.5 line-clamp-1">
              {job.role}
            </h2>
          </div>
        </div>

        {/* AI Match Gauge */}
        <div className="flex flex-col items-end flex-none">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-800 font-black text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{job.staticMatchScore}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">AI MATCH</span>
        </div>
      </div>

      {/* Main Body (Flip Front or Details Back) */}
      {!isFlipped ? (
        <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Key Attributes Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800">
              <DollarSign className="w-4 h-4 text-emerald-600 flex-none" />
              <div className="truncate">
                <p className="text-[10px] text-slate-500 uppercase font-black">Compensation</p>
                <p className="font-extrabold text-slate-900 truncate">{job.salary}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800">
              <MapPin className="w-4 h-4 text-sky-600 flex-none" />
              <div className="truncate">
                <p className="text-[10px] text-slate-500 uppercase font-black">Location</p>
                <p className="font-extrabold text-slate-900 truncate">{job.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800">
              <Calendar className="w-4 h-4 text-amber-600 flex-none" />
              <div className="truncate">
                <p className="text-[10px] text-slate-500 uppercase font-black">Deadline</p>
                <p className="font-extrabold text-amber-700 truncate">
                  {diffDays > 0 ? `${diffDays} days left` : 'Closes Soon'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-none" />
              <div className="truncate">
                <p className="text-[10px] text-slate-500 uppercase font-black">Work Setup</p>
                <p className="font-extrabold text-slate-900 truncate">{job.workType}</p>
              </div>
            </div>
          </div>

          {/* AI "Why You?" Recommendation Banner */}
          <div className="p-4 rounded-3xl bg-slate-50 border-2 border-slate-100 relative">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 mb-1 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>WHY IT MATCHES YOU</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              &quot;{job.staticWhyYou}&quot;
            </p>
          </div>

          {/* Technology & Requirement Tags */}
          <div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tech Stack & Keywords
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => {
                const userHasSkill = userProfile.skills.some(
                  (s) => s.toLowerCase() === tag.toLowerCase()
                );
                return (
                  <span
                    key={tag}
                    className={`px-3 py-1 text-xs rounded-xl font-bold border-2 transition-colors ${
                      userHasSkill
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {userHasSkill && '✓ '}
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Missing Skills Warning if any */}
          {job.missingSkills && job.missingSkills.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-none" />
              <span>Skill Gap Focus: Prep recommended for <strong>{job.missingSkills.join(', ')}</strong></span>
            </div>
          )}

        </div>
      ) : (
        /* Back View: Full Description & Requirements */
        <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200 text-xs">
          <div>
            <h4 className="font-black text-sm text-indigo-600 mb-1 uppercase tracking-wider">Role Summary</h4>
            <p className="text-slate-700 leading-relaxed font-medium">{job.description}</p>
          </div>

          <div>
            <h4 className="font-black text-sm text-indigo-600 mb-2 uppercase tracking-wider">Key Requirements</h4>
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-none" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-extrabold"
            >
              <span>View Official Career Posting</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Card Footer Info & Flip Button */}
      <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex items-center justify-between gap-3 mt-auto">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-800 text-xs font-black transition-colors shadow-sm"
        >
          <RotateCw className="w-4 h-4 text-indigo-600" />
          <span>{isFlipped ? 'Back to Card' : 'Role Specs & Requirements'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border-2 border-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Click AI Apply</span>
          </span>
        </div>
      </div>

    </div>
  );
};
