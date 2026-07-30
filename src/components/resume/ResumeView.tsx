'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing-components';
import type { UserProfile } from '@/types';

interface ResumeViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void | Promise<void>;
  onEnqueueParse?: (input: { resumeText?: string; resumeUrl?: string }) => Promise<void>;
  isParsing?: boolean;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  userProfile,
  onUpdateProfile,
  onEnqueueParse,
  isParsing: externalParsing,
}) => {
  const [resumeText, setResumeText] = useState(userProfile.rawResumeText || '');
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isParsing = externalParsing ?? isParsingLocal;

  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setIsParsingLocal(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (onEnqueueParse) {
        await onEnqueueParse({ resumeText });
        setSuccessMsg('Resume parse job queued. Skills will update when Gemini finishes.');
      }
    } catch (err) {
      console.error('Error parsing resume:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to enqueue resume parse');
    } finally {
      setIsParsingLocal(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (userProfile.skills.includes(newSkillInput.trim())) return;

    void onUpdateProfile({
      skills: [...userProfile.skills, newSkillInput.trim()],
    });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    void onUpdateProfile({
      skills: userProfile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleLoadSampleResume = () => {
    const sample = `Alex Chen
Berkeley, CA | alex.chen@university.edu | github.com/alexchen | linkedin.com/in/alexchen

EDUCATION
University of California, Berkeley - B.S. in Computer Science (Expected May 2026) | GPA: 3.85/4.0
Coursework: Data Structures, Operating Systems, Algorithms, Machine Learning, Database Systems.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, C++, HTML/CSS
Frameworks/Tools: React, Next.js, Node.js, Express, Tailwind CSS, PostgreSQL, Docker, Git, PyTorch
AI/Cloud: Gemini API, OpenAI SDK, AWS S3, Vercel, Supabase

EXPERIENCE
TechStart Lab - Full Stack Developer Intern (May 2025 - Aug 2025)
- Developed responsive web apps with React, TypeScript, and Tailwind CSS serving 12k monthly users.
- Built scalable Express.js backends integrated with PostgreSQL and Redis.
- Implemented automated AI summarization pipelines using Gemini 1.5 Flash API.

PROJECTS
SwipePrep - AI Job Prep Platform (2025)
- Created full-stack web app featuring single-card job discovery and Gemini AI prep roadmaps.
- Optimized drag-and-drop animations with Framer Motion and state management with Zustand.`;

    setResumeText(sample);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-slate-900">
      <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">AI Resume Analysis & Optimizer</h1>
            <span className="px-3 py-1 text-xs font-black bg-purple-100 text-purple-800 rounded-full border border-purple-200">
              Gemini Powered
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl">
            Upload or paste your resume to extract technical skills, compute ATS keyword optimization
            scores, and tailor bullet points for top tech roles.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            {userProfile.atsScore}
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Overall ATS Score</p>
            <p className="text-[11px] text-emerald-700 font-bold">Ready for Top 10% Tech Apps</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Resume Source Content</span>
            </h2>

            <button
              onClick={handleLoadSampleResume}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800"
            >
              Load Sample CS Resume
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <UploadButton
              endpoint="resumeUploader"
              onClientUploadComplete={async (res) => {
                const url = res?.[0]?.ufsUrl || res?.[0]?.url;
                if (!url || !onEnqueueParse) return;
                setSuccessMsg('');
                setErrorMsg('');
                try {
                  await onUpdateProfile({ resumeUrl: url });
                  await onEnqueueParse({ resumeUrl: url });
                  setSuccessMsg('PDF uploaded. Parse job queued.');
                } catch (err) {
                  setErrorMsg(err instanceof Error ? err.message : 'Upload parse failed');
                }
              }}
              onUploadError={(error: Error) => {
                setErrorMsg(error.message);
              }}
              appearance={{
                button:
                  'ut-ready:bg-indigo-600 ut-uploading:cursor-not-allowed rounded-2xl bg-slate-900 text-xs font-black px-4 py-2',
                allowedContent: 'text-[10px] text-slate-500',
              }}
            />
            {userProfile.resumeUrl && (
              <a
                href={userProfile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 underline"
              >
                View uploaded PDF
              </a>
            )}
          </div>

          <textarea
            rows={16}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your plain text resume here or click Load Sample CS Resume..."
            className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 scrollbar-thin scrollbar-thumb-slate-200"
          />

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-bold text-xs">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleParseResume}
            disabled={!resumeText.trim() || isParsing}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Parsing Resume with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Parse & Optimize Resume</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">
              AI Candidate Executive Summary
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-bold">
              &quot;{userProfile.parsedSummary}&quot;
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Extracted Skills ({userProfile.skills.length})
            </h3>

            <div className="flex flex-wrap gap-2">
              {userProfile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 font-black transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add missing skill (e.g. Docker, GraphQL)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm"
              >
                Add Skill
              </button>
            </form>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Recommended Job Match Targets
            </h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.targetRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-xs font-black"
                >
                  🎯 {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
