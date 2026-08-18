'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FilePlus2,
  Wand2,
  Briefcase,
  Save,
  Target,
  Lightbulb,
  Building2,
  MapPin,
} from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing-components';
import type { Application, UserProfile } from '@/types';

interface ResumeViewProps {
  userProfile: UserProfile;
  applications?: Application[];
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void | Promise<void>;
  onEnqueueParse?: (input: { resumeText?: string; resumeUrl?: string }) => Promise<void>;
  isParsing?: boolean;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  userProfile,
  applications = [],
  onUpdateProfile,
  onEnqueueParse,
  isParsing: externalParsing,
}) => {
  const [resumeText, setResumeText] = useState(userProfile.rawResumeText || '');
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Mode: 'create' (build from scratch) | 'tailor' (tailor to a job)
  const [mode, setMode] = useState<'create' | 'tailor'>('create');

  // Create mode
  const [name, setName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [university, setUniversity] = useState(userProfile.university || '');
  const [gradYear, setGradYear] = useState(userProfile.graduationYear || '');
  const [gpa, setGpa] = useState(userProfile.gpa || '');
  const [projectsText, setProjectsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');
  const [resumeTips, setResumeTips] = useState<string[]>([]);

  // Tailor mode
  const [selectedAppId, setSelectedAppId] = useState('');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState('');
  const [tailorKeywords, setTailorKeywords] = useState<string[]>([]);
  const [tailorNotes, setTailorNotes] = useState('');

  const isParsing = externalParsing ?? isParsingLocal;

  const selectedApp = applications.find((a) => a.id === selectedAppId) || null;

  const setMessage = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
  };

  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setIsParsingLocal(true);
    setMessage('');
    try {
      if (onEnqueueParse) {
        await onEnqueueParse({ resumeText });
        setMessage('Resume parse job queued. Skills will update when Gemini finishes.');
      }
    } catch (err) {
      console.error('Error parsing resume:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to enqueue resume parse', true);
    } finally {
      setIsParsingLocal(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (userProfile.skills.includes(newSkillInput.trim())) return;
    void onUpdateProfile({ skills: [...userProfile.skills, newSkillInput.trim()] });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    void onUpdateProfile({ skills: userProfile.skills.filter((s) => s !== skillToRemove) });
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

  // --- Create resume with AI ---
  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setMessage('');
    setGeneratedResume('');
    setResumeTips([]);
    try {
      const res = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          university,
          graduationYear: gradYear,
          gpa,
          skills: userProfile.skills,
          experiences: userProfile.experiences || [],
          projects: projectsText
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean),
          targetRoles: userProfile.targetRoles,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to generate resume');
      }
      const data = await res.json();
      setGeneratedResume(data.resume || '');
      setResumeTips(data.tips || []);
    } catch (err) {
      console.error('Error generating resume:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to generate resume', true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedResume.trim()) return;
    await onUpdateProfile({ rawResumeText: generatedResume });
    setResumeText(generatedResume);
    setMessage('Resume saved to your profile. Click "Parse & Optimize Resume" to re-extract skills.');
  };

  // --- Tailor resume to a job ---
  const handleTailorResume = async () => {
    if (!selectedApp) return;
    setIsTailoring(true);
    setMessage('');
    setTailoredResume('');
    setTailorKeywords([]);
    setTailorNotes('');
    const sourceResume = resumeText.trim() || generatedResume || userProfile.rawResumeText || '';
    if (!sourceResume.trim()) {
      setMessage('Add your base resume first — paste it in Resume Source Content below or generate one in Create mode.', true);
      setIsTailoring(false);
      return;
    }
    try {
      const res = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedApp.job.companyName,
          role: selectedApp.job.role,
          jobDescription: selectedApp.job.description,
          jobRequirements: selectedApp.job.requirements,
          currentResume: sourceResume,
          skills: userProfile.skills,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to tailor resume');
      }
      const data = await res.json();
      setTailoredResume(data.tailoredResume || '');
      setTailorKeywords(data.keywords || []);
      setTailorNotes(data.focusNotes || '');
    } catch (err) {
      console.error('Error tailoring resume:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to tailor resume', true);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleSaveTailored = async () => {
    if (!tailoredResume.trim()) return;
    await onUpdateProfile({ rawResumeText: tailoredResume });
    setResumeText(tailoredResume);
    setMessage('Tailored resume saved to your profile.');
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:border-indigo-600';
  const labelClass = 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400';
  const panelClass =
    'p-6 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 shadow-sm';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0A0C12] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-slate-50">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">AI Resume Analysis & Optimizer</h1>
            <span className="px-3 py-1 text-xs font-black bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-500/30">
              Gemini Powered
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 mt-1 max-w-xl">
            Create a resume from scratch, tailor it to a specific company role, or upload an existing one to extract skills and compute your ATS score.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            {userProfile.atsScore}
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-50">Overall ATS Score</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">Ready for Top 10% Tech Apps</p>
          </div>
        </div>
      </div>

      {/* ===== Mode selector ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setMode('create')}
          className={`p-6 rounded-3xl border-2 text-left transition-all ${
            mode === 'create'
              ? 'bg-indigo-600 dark:bg-indigo-600 border-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-950'
              : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-indigo-500 shadow-sm'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
              mode === 'create'
                ? 'bg-white/15 text-white'
                : 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <FilePlus2 className="w-5 h-5" />
          </div>
          <p
            className={`text-sm font-black ${
              mode === 'create' ? 'text-white' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            Create a Resume
          </p>
          <p
            className={`text-[11px] font-semibold mt-1 ${
              mode === 'create' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Build a polished, ATS-friendly resume from your education, skills, and experience — with AI writing the bullets.
          </p>
        </button>

        <button
          onClick={() => setMode('tailor')}
          className={`p-6 rounded-3xl border-2 text-left transition-all ${
            mode === 'tailor'
              ? 'bg-violet-600 dark:bg-violet-600 border-violet-700 shadow-lg shadow-violet-200 dark:shadow-violet-950'
              : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-violet-500 shadow-sm'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
              mode === 'tailor'
                ? 'bg-white/15 text-white'
                : 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
            }`}
          >
            <Wand2 className="w-5 h-5" />
          </div>
          <p className={`text-sm font-black ${mode === 'tailor' ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}>
            Tailor My Resume
          </p>
          <p
            className={`text-[11px] font-semibold mt-1 ${
              mode === 'tailor' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Pick a company from your Interested list and get a version of your resume rewritten for that exact role.
          </p>
        </button>
      </div>

      {/* ===== Create mode ===== */}
      {mode === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Builder form */}
          <div className={`${panelClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <FilePlus2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Resume Builder</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <label className={labelClass}>University</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="BMS Institute of Technology" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Graduation</label>
                <input type="text" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2028" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>GPA</label>
                <input type="text" value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="8.5/10" className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Skills (from your profile)</label>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border-2 border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 font-black transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {userProfile.skills.length === 0 && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    No skills yet — add some below or parse a resume.
                  </span>
                )}
              </div>
              <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add missing skill (e.g. Docker, GraphQL)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm"
                >
                  Add
                </button>
              </form>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                Projects / Achievements <span className="normal-case font-semibold text-slate-400">(one per line)</span>
              </label>
              <textarea
                rows={3}
                value={projectsText}
                onChange={(e) => setProjectsText(e.target.value)}
                placeholder={'SwipePrep - AI Job Prep Platform\nBuilt single-card job discovery with React + Next.js'}
                className={`${inputClass} font-mono resize-none`}
              />
            </div>

            <button
              onClick={handleGenerateResume}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Writing your resume with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Resume with AI</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold">
              Uses only the facts above — the AI writes strong, quantified bullets and a clean one-page layout.
            </p>
          </div>

          {/* Generated output */}
          <div className={`${panelClass} space-y-3 flex flex-col`}>
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Your Generated Resume</span>
            </h2>

            {generatedResume ? (
              <>
                <textarea
                  rows={18}
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0C12] border-2 border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-indigo-600 resize-y"
                />
                {resumeTips.length > 0 && (
                  <div className="space-y-1.5">
                    <p className={labelClass}>AI Tips</p>
                    {resumeTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-none mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleSaveGenerated}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-950"
                >
                  <Save className="w-4 h-4" />
                  <span>Save to My Profile</span>
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-black text-slate-900 dark:text-slate-50">Your resume will appear here</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs mt-1">
                  Fill in the builder, then hit Generate Resume with AI. You can edit anything before saving.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Tailor mode ===== */}
      {mode === 'tailor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Select + trigger */}
          <div className={`${panelClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Tailor for a Specific Role</span>
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Choose a role from your Interested list</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select a company & role...</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.job.companyName} — {app.job.role}
                  </option>
                ))}
              </select>
            </div>

            {selectedApp && (
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border-2 border-violet-200 dark:border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-none" />
                  <p className="text-sm font-black text-slate-900 dark:text-slate-50">{selectedApp.job.companyName}</p>
                  <span className="text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-wider ml-auto">
                    {selectedApp.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-violet-800 dark:text-violet-300 leading-snug">{selectedApp.job.role}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                  <MapPin className="w-3 h-3" />
                  {selectedApp.job.location}
                </p>
                {selectedApp.job.requirements.slice(0, 5).map((req, idx) => (
                  <p key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-snug">
                    • {req}
                  </p>
                ))}
              </div>
            )}

            {applications.length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                No saved companies yet — swipe right on roles in Discover to add them to Interested.
              </p>
            )}

            <button
              onClick={handleTailorResume}
              disabled={!selectedApp || isTailoring}
              className="w-full py-3.5 px-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-200 dark:shadow-violet-950 disabled:opacity-50"
            >
              {isTailoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tailoring for {selectedApp ? selectedApp.job.companyName : '...'}...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Tailor Resume for {selectedApp ? `${selectedApp.job.companyName} — ${selectedApp.job.role}` : 'Selected Role'}</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold">
              Uses your current resume (from Resume Source Content below) and rewrites it with this job&apos;s exact keywords and priorities.
            </p>
          </div>

          {/* Tailored output */}
          <div className={`${panelClass} space-y-3 flex flex-col`}>
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tailored Resume {selectedApp ? `— ${selectedApp.job.companyName}` : ''}</span>
            </h2>

            {tailoredResume ? (
              <>
                <textarea
                  rows={18}
                  value={tailoredResume}
                  onChange={(e) => setTailoredResume(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0C12] border-2 border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-violet-600 resize-y"
                />

                {tailorKeywords.length > 0 && (
                  <div className="space-y-1.5">
                    <p className={labelClass}>Keywords this role expects — make sure they appear</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tailorNotes && (
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-[11px] font-semibold text-violet-900 dark:text-violet-200 leading-relaxed">
                    <Lightbulb className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 flex-none mt-0.5" />
                    <span>{tailorNotes}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveTailored}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-950"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Tailored Resume</span>
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-black text-slate-900 dark:text-slate-50">Your tailored resume will appear here</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs mt-1">
                  Pick a company from Interested, then hit Tailor Resume to get a version rewritten for that exact role.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Resume Source Content (existing functionality) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${panelClass} space-y-4 flex flex-col`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Resume Source Content</span>
            </h2>

            <button
              onClick={handleLoadSampleResume}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300"
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
                setMessage('');
                try {
                  await onUpdateProfile({ resumeUrl: url });
                  await onEnqueueParse({ resumeUrl: url });
                  setMessage('PDF uploaded. Parse job queued.');
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : 'Upload parse failed', true);
                }
              }}
              onUploadError={(error: Error) => {
                setMessage(error.message, true);
              }}
              appearance={{
                button:
                  'ut-ready:bg-indigo-600 ut-uploading:cursor-not-allowed rounded-2xl bg-slate-900 text-xs font-black px-4 py-2',
                allowedContent: 'text-[10px] text-slate-500 dark:text-slate-500',
              }}
            />
            {userProfile.resumeUrl && (
              <a
                href={userProfile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline"
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
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0C12] border-2 border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:border-indigo-600 scrollbar-thin scrollbar-thumb-slate-200"
          />

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-none" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 font-bold text-xs">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleParseResume}
            disabled={!resumeText.trim() || isParsing}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-50"
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
          <div className={`${panelClass} space-y-3`}>
            <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              AI Candidate Executive Summary
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-bold">
              &quot;{userProfile.parsedSummary}&quot;
            </p>
          </div>

          <div className={`${panelClass} space-y-4`}>
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider">
              Extracted Skills ({userProfile.skills.length})
            </h3>

            <div className="flex flex-wrap gap-2">
              {userProfile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border-2 border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 dark:text-slate-600 hover:text-rose-600 font-black transition-colors"
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
                className={inputClass}
              />
              <button
                type="submit"
                className="flex-none px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm"
              >
                Add Skill
              </button>
            </form>
          </div>

          <div className={`${panelClass} space-y-3`}>
            <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Recommended Job Match Targets
            </h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.targetRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 text-xs font-black"
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
