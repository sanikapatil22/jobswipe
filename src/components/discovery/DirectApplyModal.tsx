'use client';
import React, { useState } from 'react';
import { 
  Building2, Sparkles, User, Mail, GraduationCap, FileText, 
  CheckCircle2, X, Send, ShieldCheck
} from 'lucide-react';
import { Job, UserProfile } from '@/types';

interface DirectApplyModalProps {
  job: Job;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onConfirmApply: (job: Job) => void;
}

export const DirectApplyModal: React.FC<DirectApplyModalProps> = ({
  job,
  userProfile,
  isOpen,
  onClose,
  onConfirmApply,
}) => {
  const [includeRoadmap, setIncludeRoadmap] = useState(true);
  const [openOfficialPage, setOpenOfficialPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Find matching skills between candidate and job
  const matchedSkills = userProfile.skills.filter((skill) =>
    job.tags.some((tag) => tag.toLowerCase() === skill.toLowerCase())
  );

  const handleSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onConfirmApply(job);
        if (openOfficialPage && job.applyUrl) {
          window.open(job.applyUrl, '_blank');
        }
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white border-4 border-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b-2 border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">1-Click Direct AI Application</h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Applying with verified student profile & parsed resume
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[75vh]">
          
          {/* Target Role Card Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-slate-900 p-1 flex items-center justify-center flex-none overflow-hidden">
              <img 
                src={job.companyLogo} 
                alt={job.companyName} 
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Building2 className="w-6 h-6 text-white absolute" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">{job.companyName}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs">
                  {job.staticMatchScore}% ATS Match
                </span>
              </div>
              <p className="font-extrabold text-indigo-700 text-sm leading-tight mt-0.5">{job.role}</p>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {job.salary} • {job.location} ({job.workType})
              </p>
            </div>
          </div>

          {/* Extracted Details from Profile & Resume */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Data Transmitted from Profile & Resume</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 flex-none" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Candidate</p>
                  <p className="font-black text-slate-900 truncate">{userProfile.name}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 flex-none" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Email</p>
                  <p className="font-black text-slate-900 truncate">{userProfile.email}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center gap-2 sm:col-span-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 flex-none" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Academic Background</p>
                  <p className="font-bold text-slate-900 truncate">
                    {userProfile.university} • Grad: {userProfile.graduationYear} (GPA: {userProfile.gpa})
                  </p>
                </div>
              </div>
            </div>

            {/* Resume Executive Pitch Note */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                <span className="flex items-center gap-1 text-indigo-600">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume Pitch Summary</span>
                </span>
                <span className="text-emerald-700 font-extrabold">{userProfile.atsScore}/100 ATS Score</span>
              </div>
              <p className="text-xs font-medium text-slate-600 italic leading-relaxed line-clamp-2">
                &quot;{userProfile.parsedSummary}&quot;
              </p>
            </div>

            {/* Matching Tech Stack Skills */}
            {matchedSkills.length > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
                <p className="text-[11px] font-black text-emerald-800 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matched Resume Skills ({matchedSkills.length}):</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchedSkills.map((sk) => (
                    <span key={sk} className="px-2.5 py-0.5 bg-white border border-emerald-300 text-emerald-900 text-[11px] font-black rounded-lg">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Action Preferences */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRoadmap}
                onChange={(e) => setIncludeRoadmap(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <span>Generate AI Interview Prep Roadmap in My Companies</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={openOfficialPage}
                onChange={(e) => setOpenOfficialPage(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <span>Open official career posting page in a new window</span>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting || isSuccess}
            className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-800 font-black text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isSuccess}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>Application Submitted!</span>
              </>
            ) : isSubmitting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Submitting Profile Data...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm 1-Click Application</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
