'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Send,
  MessageSquare,
  ExternalLink,
  BookOpen,
  Award,
  Lightbulb,
  RefreshCw,
  Volume2,
  VolumeX,
  Video,
  Layers,
  ListChecks,
  Wrench,
  Mic,
  MicOff,
  Loader2,
  Square,
  MapPin,
  Target,
  Clock,
  Building2,
  Route,
  Play,
  Code2,
  Database,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Application, MockInterviewMessage, UserProfile, AIRoadmap } from '@/types';
import { getCompanyProblems, COMPANY_PROBLEMS, type CompanyProblem } from '@/data/company-problems';
import {
  SYSTEM_DESIGN_QUESTIONS,
  SYSTEM_DESIGN_FUNDAMENTALS,
  SYSTEM_DESIGN_RESOURCES,
} from '@/data/system-design';
import { useSpeechSynthesis } from '@/lib/use-speech-synthesis';
import { useSpeechRecognition } from '@/lib/use-speech-recognition';
import { useAudioTranscription } from '@/lib/use-audio-transcription';
import { LiveKitCall } from './LiveKitCall';

interface CompanyPrepDetailProps {
  application: Application;
  userProfile: UserProfile;
  onClose: () => void;
  onGenerateRoadmap: (appId: string) => Promise<void>;
  onGenerateInsights?: (appId: string) => Promise<void>;
  onUpdateTaskCompletion: (appId: string, stepId: string, taskId: string, completed: boolean) => void;
}

const FALLBACK_QUESTIONS = [
  'Explain your technical approach to building scalable web APIs.',
  'Describe a complex bug you debugged and how you resolved it.',
  'Walk me through a project where you had to make a major technical trade-off.',
];

const FALLBACK_INSIGHTS = [
  'This company values extreme velocity combined with API consistency.',
  'High emphasis on automated CI/CD testing and developer ergonomics.',
  'System design interviews test real production edge cases rather than theoretical trivia.',
];

const ROADMAP_CHECKLIST = [
  'Analyzing role requirements',
  'Extracting required skills',
  'Mapping interview topics',
  'Building personalized roadmap',
];

const INSIGHTS_CHECKLIST = [
  'Scanning the job description',
  'Researching products & engineering culture',
  'Mapping the interview process',
  'Building the question bank',
];

const formatMinutes = (m: number) => {
  if (!m || m <= 0) return '—';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

const isStepComplete = (step: AIRoadmap['steps'][number]) =>
  step.completed || (step.tasks.length > 0 && step.tasks.every((t) => t.completed));

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  video: <Play className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
  practice: <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
  article: <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />,
};

const difficultyClass = (d: CompanyProblem['difficulty']) =>
  d === 'EASY'
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
    : d === 'MEDIUM'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';

export const CompanyPrepDetail: React.FC<CompanyPrepDetailProps> = ({
  application,
  userProfile,
  onClose,
  onGenerateRoadmap,
  onGenerateInsights = async () => undefined,
  onUpdateTaskCompletion,
}) => {
  const { job, roadmap, roadmapStatus, insights, insightsStatus } = application;
  const [activeTab, setActiveTab] = useState<
    'roadmap' | 'interview' | 'insights' | 'practice'
  >('roadmap');
  const [problemFilter, setProblemFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  // Auto-open the next phase you haven't finished when the roadmap loads.
  useEffect(() => {
    if (roadmap && roadmap.steps.length > 0) {
      const firstIncomplete = roadmap.steps.findIndex((s) => !isStepComplete(s));
      setSelectedStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    }
  }, [roadmap]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(
    roadmapStatus === 'GENERATING'
  );
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(
    insightsStatus === 'GENERATING'
  );

  const { supported: speechSupported, enabled: speechEnabled, setEnabled: setSpeechEnabled, speak, stop, speaking } = useSpeechSynthesis();
  const {
    supported: sttSupported,
    listening: isListening,
    interim: interimTranscript,
    error: sttError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition();
  // Record-with-the-mic fallback (Gemini transcription) for browsers where
  // the Web Speech API is unavailable or fails.
  const audioTx = useAudioTranscription();

  // Pick a real, company-specific opening question (insights > roadmap > fallback).
  const openingQuestion = useMemo(() => {
    const fromInsights = insights?.sampleQuestions?.[0];
    const fromRoadmap = roadmap?.sampleQuestions?.[0];
    return (
      fromInsights ||
      fromRoadmap ||
      `How would you design a rate limiter or handle idempotent API payment requests for ${job.companyName}? Walk me through your approach step-by-step.`
    );
  }, [insights, roadmap, job.companyName]);

  // AI Mock Interview Chat state
  const [chatMessages, setChatMessages] = useState<MockInterviewMessage[]>([
    {
      id: 'msg_init',
      sender: 'ai',
      text: `Welcome to your mock interview for the ${job.role} position at ${job.companyName}! Let's start with a classic challenge: "${openingQuestion}" Take your time and walk me through your approach step-by-step.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // --- Preparation summary metrics (all derived from real data) ---
  let totalTasksCount = 0;
  let completedTasksCount = 0;
  if (roadmap) {
    roadmap.steps.forEach((step) => {
      step.tasks.forEach((task) => {
        totalTasksCount++;
        if (task.completed) completedTasksCount++;
      });
    });
  }
  const prepPercent =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const topicsTotal = roadmap?.steps.length ?? 0;
  const topicsDone = roadmap
    ? roadmap.steps.filter(
        (s) => s.completed || (s.tasks.length > 0 && s.tasks.every((t) => t.completed))
      ).length
    : 0;

  const nextRecommended = useMemo(() => {
    if (!roadmap) return null;
    const next = roadmap.steps.find(
      (s) => !s.completed && !(s.tasks.length > 0 && s.tasks.every((t) => t.completed))
    );
    return next?.title ?? null;
  }, [roadmap]);

  const matchScore = application.matchScore ?? job.staticMatchScore;
  const currentQuestionNumber = chatMessages.filter((m) => m.sender === 'ai').length;

  // Company-specific LeetCode problems (with graceful fallback for companies
  // that have no public data in the company-wise dataset).
  const companyProblems = getCompanyProblems(job.companyName);
  const hasPublicCompanyData = !!COMPANY_PROBLEMS[job.companyName];
  const visibleProblems =
    problemFilter === 'ALL'
      ? companyProblems
      : companyProblems.filter((p) => p.difficulty === problemFilter);

  // --- Generation triggers (identical behavior, new UI) ---
  const handleGenerateRoadmapClick = async () => {
    setIsGeneratingRoadmap(true);
    try {
      await onGenerateRoadmap(application.id);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleGenerateInsightsClick = async () => {
    setIsGeneratingInsights(true);
    try {
      await onGenerateInsights(application.id);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const speakMessage = (text: string) => {
    if (!speechSupported) return;
    speak(text);
  };

  // Toggle voice transcription: spoken answers land in the input box.
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening((finalText) => {
      setInputMessage((prev) => (prev.trim() ? `${prev.trim()} ${finalText}` : finalText));
    });
  };

  // Record-with-the-mic fallback: tap to record, tap again to stop & transcribe.
  const handleRecordClick = async () => {
    if (audioTx.state === 'recording') {
      const text = await audioTx.stop();
      if (text) {
        setInputMessage((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      }
    } else if (audioTx.state === 'idle' || audioTx.state === 'error') {
      void audioTx.start();
    }
  };

  const goToRoadmap = () => {
    setActiveTab('roadmap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit answer to AI Mock Interviewer (streaming)
  const handleSendInterviewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiResponding) return;

    const userMsgText = inputMessage.trim();
    setInputMessage('');

    const userMsg: MockInterviewMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiResponding(true);

    const aiMsgId = `ai_${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: job.companyName,
          role: job.role,
          userMessage: userMsgText,
          targetQuestion: openingQuestion,
          history: chatMessages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Mock interview request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let feedback: MockInterviewMessage['feedback'];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.type === 'token') {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, text: m.text + payload.text } : m
              )
            );
          }
          if (payload.type === 'done') {
            feedback = payload.feedback || undefined;
            const finalReply =
              payload.reply ||
              chatMessages.find((m) => m.id === aiMsgId)?.text.replace(/```json[\s\S]*?```/g, '').trim();
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: finalReply || m.text,
                      feedback,
                    }
                  : m
              )
            );
            // Speak the interviewer's answer out loud when voice mode is on.
            if (speechEnabled && finalReply) {
              speakMessage(finalReply);
            }
          }
          if (payload.type === 'error') {
            throw new Error(payload.error || 'Stream error');
          }
        }
      }
    } catch (err) {
      console.error('Error during mock interview response:', err);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text:
                  m.text ||
                  'Sorry — the interviewer could not respond. Please try again.',
              }
            : m
        )
      );
    } finally {
      setIsAiResponding(false);
    }
  };

  // --- Shared UI primitives (compact) ---
  const eyebrow = (text: string, accent = 'text-indigo-600 dark:text-indigo-400') => (
    <p className={`text-[10px] uppercase tracking-[0.22em] font-bold ${accent}`}>{text}</p>
  );

  const chip = (label: string, active = false) => (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
        active
          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
          : 'bg-slate-100/80 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
      }`}
    >
      {label}
    </span>
  );

  const generationChecklist = (items: string[], label: string, companyName: string) => (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-6 flex flex-col items-center text-center">
      <div className="w-9 h-9 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
        <RefreshCw className="w-4 h-4 animate-spin" />
      </div>
      {eyebrow(label)}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-1">
        Analyzing the {companyName} role…
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Runs as a background job — the page updates when it finishes.</p>
      <div className="w-full max-w-xs mx-auto space-y-1.5 text-left">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-2.5 text-xs animate-[prepFadeUp_0.4s_ease_both]"
            style={{ animationDelay: `${0.3 + i * 0.5}s` }}
          >
            {i < 2 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-none" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-600 flex-none animate-pulse" />
            )}
            <span className={i < 2 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-600 dark:text-slate-500 font-medium'}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const emptyState = ({
    label,
    title,
    description,
    actionLabel,
    onAction,
    busy,
    accent,
  }: {
    label: string;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    busy?: boolean;
    accent?: 'indigo' | 'sky';
  }) => (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-5 py-6 flex flex-col items-center text-center">
      <div
        className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${
          accent === 'sky'
            ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
            : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
        }`}
      >
        <Sparkles className="w-4 h-4" />
      </div>
      {eyebrow(label)}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4 leading-relaxed">{description}</p>
      <button
        onClick={onAction}
        disabled={busy}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50 ${
          accent === 'sky'
            ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'
            : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20'
        }`}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {actionLabel}
      </button>
    </section>
  );

  const monogram =
    job.companyLogo ||
    job.companyName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-[#0A0C12] text-slate-800 dark:text-slate-200">
      <style>{`
        @keyframes prepFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes prepDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .prep-no-scrollbar { scrollbar-width: none; }
        .prep-no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_55%_100%_at_50%_-30%,rgba(99,102,241,0.14),transparent)]" />

      {/* ===== Sticky header (compact) ===== */}
      <div className="sticky top-0 z-20 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0C12]/85 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="flex-none p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Back to companies"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 font-bold truncate">
                {job.companyName}
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{job.role}</p>
            </div>
          </div>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[11px] transition-colors shadow-lg shadow-indigo-500/20"
          >
            <span className="hidden sm:inline">Open Application</span>
            <span className="sm:hidden">Apply</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
        {/* ===== 1. Company / job header — one efficient row ===== */}
        <section className="flex items-center gap-3 animate-[prepFadeUp_0.3s_ease_both]">
          <div className="flex-none w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/25">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogo} alt={job.companyName} className="w-7 h-7 object-contain" />
            ) : (
              monogram
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-500 truncate">
              {job.companyName}
              {job.companySize && <span className="normal-case tracking-normal text-slate-500 dark:text-slate-600"> · {job.companySize}</span>}
            </p>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
              {job.role}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-600 dark:text-slate-500" />
                  {job.location}
                </span>
              )}
              {job.workType && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-600 dark:text-slate-500" />
                  {job.workType}
                </span>
              )}
              {matchScore != null && matchScore > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Target className="w-3 h-3" />
                  {matchScore}% match
                </span>
              )}
            </div>
          </div>
          <div className="flex-none flex items-center gap-2">
            {job.salary && job.salary !== 'Not disclosed' && (
              <span className="hidden md:flex items-center px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.03] text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {job.salary}
              </span>
            )}
            <span className="flex items-center px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[9px] font-black uppercase tracking-wider">
              {application.status}
            </span>
          </div>
        </section>

        {/* ===== 2. Preparation summary — horizontal strip ===== */}
        <section className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.03] px-4 py-2 animate-[prepFadeUp_0.35s_ease_both]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-500 font-bold">
            Preparation
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white leading-none">{prepPercent}%</span>
            <span className="hidden sm:block w-36 h-1 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${prepPercent}%` }}
              />
            </span>
          </span>
          {roadmap && (
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{topicsDone}/{topicsTotal}</span> topics
            </span>
          )}
          {nextRecommended ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
              Next: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{nextRecommended}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-600 dark:text-slate-500">Generate a roadmap to see your plan.</span>
          )}
          <button
            onClick={goToRoadmap}
            className="ml-auto flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors"
          >
            Continue Preparing
            <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          </button>
        </section>

        {/* ===== 3. Segmented tabs (compact) ===== */}
        <nav className="flex items-center gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] w-fit max-w-full overflow-x-auto prep-no-scrollbar">
          {(
            [
              { id: 'roadmap', label: 'AI Roadmap', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'interview', label: 'Mock Interview', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { id: 'practice', label: 'Practice & Resources', icon: <Code2 className="w-3.5 h-3.5" /> },
              { id: 'insights', label: 'Insights & Questions', icon: <BookOpen className="w-3.5 h-3.5" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ============================================================
            TAB 1: AI ROADMAP (compact timeline)
        ============================================================ */}
        {activeTab === 'roadmap' && (
          <div key="roadmap" className="space-y-3 animate-[prepFadeUp_0.25s_ease_both]">
            {!roadmap && roadmapStatus !== 'GENERATING' ? (
              emptyState({
                label: 'AI Roadmap',
                title:
                  roadmapStatus === 'FAILED'
                    ? 'Unable to generate your roadmap'
                    : 'Your personalized roadmap is waiting.',
                description:
                  roadmapStatus === 'FAILED'
                    ? `The AI service couldn't complete the request for the ${job.companyName} ${job.role} role. Try again in a moment.`
                    : `Generate a roadmap based on the actual ${job.companyName} ${job.role} role — requirements, tech stack, and interview reports.`,
                actionLabel:
                  roadmapStatus === 'FAILED'
                    ? 'Try Again'
                    : isGeneratingRoadmap
                      ? 'Generating…'
                      : 'Generate AI Roadmap',
                onAction: handleGenerateRoadmapClick,
                busy: isGeneratingRoadmap,
              })
            ) : !roadmap && (roadmapStatus === 'GENERATING' || isGeneratingRoadmap) ? (
              generationChecklist(ROADMAP_CHECKLIST, 'AI Roadmap', job.companyName)
            ) : roadmap ? (
              <div className="space-y-3">
                {/* Roadmap header — overall progress + strategic focus in one strip */}
                <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-2.5 animate-[prepFadeUp_0.3s_ease_both]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Route className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-none" />
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300 font-bold">
                        AI Roadmap
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed truncate">
                        {roadmap.overallFocus}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-none">
                    <span className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="text-slate-900 dark:text-white font-bold">{topicsDone}/{topicsTotal}</span> phases
                      <span className="hidden sm:block w-24 h-1 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${topicsTotal > 0 ? (topicsDone / topicsTotal) * 100 : 0}%` }}
                        />
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <Clock className="w-3 h-3 text-slate-600 dark:text-slate-500" />
                      {formatMinutes(
                        roadmap.steps.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0)
                      )}{' '}
                      total
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="text-slate-900 dark:text-white font-bold">{completedTasksCount}/{totalTasksCount}</span>{' '}
                      tasks done
                    </span>
                  </div>
                </section>

                {/* Master-detail: journey timeline + phase workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 items-start">
                  {/* Journey timeline */}
                  <section className="lg:sticky lg:top-[60px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-2 space-y-1 animate-[prepFadeUp_0.3s_ease_both]">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold px-2 pt-1.5 pb-1">
                      Prep Journey
                    </p>
                    <div className="relative">
                      <div className="absolute left-[17px] top-7 bottom-7 w-px bg-slate-100 dark:bg-white/[0.08]" />
                      {roadmap.steps.map((step, idx) => {
                        const stepDone = step.tasks.filter((t) => t.completed).length;
                        const stepTotal = step.tasks.length;
                        const stepComplete = isStepComplete(step);
                        const isSelected = selectedStepIndex === idx;
                        const isUpNext =
                          idx === roadmap.steps.findIndex((s) => !isStepComplete(s)) && !stepComplete;
                        const inProgress = stepDone > 0 && !stepComplete;

                        return (
                          <button
                            key={step.id}
                            onClick={() => setSelectedStepIndex(idx)}
                            className={`w-full flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all animate-[prepFadeUp_0.3s_ease_both] ${
                              isSelected
                                ? 'border-indigo-500/50 bg-indigo-500/[0.08]'
                                : 'border-transparent hover:border-slate-200 dark:hover:border-white/15 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                            }`}
                            style={{ animationDelay: `${idx * 0.06}s` }}
                          >
                            <div
                              className={`flex-none w-8 h-8 rounded-lg border flex items-center justify-center ${
                                stepComplete
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : isSelected
                                    ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-200 shadow-lg shadow-indigo-500/20'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0C12] text-slate-600 dark:text-slate-500'
                              }`}
                            >
                              {stepComplete ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span className="text-[11px] font-black">
                                  {String(step.stepNumber).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4
                                  className={`text-xs font-bold truncate ${
                                    isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {step.title}
                                </h4>
                                <span className="flex-none text-[9px] font-semibold text-slate-600 dark:text-slate-500">
                                  {step.estimatedMinutes}m
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-500 truncate">{step.subtitle}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-0.5 flex-1 max-w-[90px] rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      stepComplete
                                        ? 'bg-emerald-400'
                                        : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                    }`}
                                    style={{
                                      width: `${stepTotal > 0 ? Math.round((stepDone / stepTotal) * 100) : 0}%`,
                                    }}
                                  />
                                </div>
                                <span className="flex-none text-[9px] text-slate-600 dark:text-slate-500 font-bold">
                                  {stepDone}/{stepTotal}
                                </span>
                                {stepComplete ? (
                                  <span className="flex-none text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Done
                                  </span>
                                ) : isSelected ? (
                                  <span className="flex-none text-[8px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                                    Current
                                  </span>
                                ) : inProgress ? (
                                  <span className="flex-none text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    In progress
                                  </span>
                                ) : isUpNext ? (
                                  <span className="flex-none text-[8px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300/80">
                                    Next
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Phase workspace */}
                  {roadmap.steps[selectedStepIndex] && (() => {
                    const step = roadmap.steps[selectedStepIndex];
                    const stepDone = step.tasks.filter((t) => t.completed).length;
                    const stepTotal = step.tasks.length;
                    const stepComplete = isStepComplete(step);
                    const categories = [...new Set(step.tasks.map((t) => t.category))];
                    const practiceQuestion =
                      roadmap.sampleQuestions[selectedStepIndex % roadmap.sampleQuestions.length];

                    return (
                      <section
                        key={`detail-${selectedStepIndex}`}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-3.5 animate-[prepFadeUp_0.25s_ease_both]"
                      >
                        {/* Phase header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[9px] font-black uppercase tracking-wider">
                            Phase {step.stepNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                            {step.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white min-w-0 truncate">{step.title}</h3>
                          <span className="ml-auto flex-none flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-500 font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            ~{step.estimatedMinutes} min
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.subtitle}</p>

                        {/* Phase progress */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-1 flex-1 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stepComplete
                                  ? 'bg-emerald-400'
                                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                              }`}
                              style={{
                                width: `${stepTotal > 0 ? Math.round((stepDone / stepTotal) * 100) : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {stepDone}/{stepTotal} tasks
                          </span>
                          {stepComplete && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </span>
                          )}
                        </div>

                        {/* Tasks */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold">
                            Actionable Practice Tasks
                          </p>
                          {step.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() =>
                                onUpdateTaskCompletion(application.id, step.id, task.id, !task.completed)
                              }
                              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                                task.completed
                                  ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                                  : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-none" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-500 dark:text-slate-600 flex-none" />
                                )}
                                <span
                                  className={`text-xs font-medium leading-snug ${
                                    task.completed ? 'text-slate-600 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              <span className="flex-none px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-500 text-[9px] font-bold">
                                {task.category}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Skills covered */}
                        {categories.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold mr-0.5">
                              Covers
                            </span>
                            {categories.map((c) => (
                              <span key={c}>{chip(c, true)}</span>
                            ))}
                          </div>
                        )}

                        {/* Resources */}
                        {step.resources.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-200 dark:border-white/10">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold mb-2">
                              Recommended Study Links
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {step.resources.map((res, idx) => (
                                <a
                                  key={idx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.03] text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  {RESOURCE_ICONS[res.type] ?? (
                                    <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                  <span className="max-w-[180px] truncate">{res.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-600 dark:text-slate-500" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Practice cross-link */}
                        {roadmap.sampleQuestions.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-3">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 flex-1 min-w-0 leading-relaxed">
                              <span className="font-bold text-slate-800 dark:text-slate-200">Practice:</span>{' '}
                              {practiceQuestion}
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab('interview');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex-none flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[10px] transition-colors"
                            >
                              Mock Interview
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </section>
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================
            TAB 2: MOCK INTERVIEW (viewport-efficient)
        ============================================================ */}
        {activeTab === 'interview' && (
          <div key="interview" className="space-y-3 animate-[prepFadeUp_0.25s_ease_both]">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {eyebrow('Mock Interview')}
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {job.companyName} · {job.role}
                </h2>
              </div>
              {speechSupported && (
                <button
                  onClick={() => {
                    const next = !speechEnabled;
                    setSpeechEnabled(next);
                    if (next) {
                      const lastAi = [...chatMessages].reverse().find((m) => m.sender === 'ai');
                      if (lastAi?.text) speakMessage(lastAi.text);
                    } else {
                      stop();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    speechEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/25'
                  }`}
                >
                  {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{speechEnabled ? (speaking ? 'Speaking…' : 'Voice On') : 'Voice Off'}</span>
                </button>
              )}
            </div>

            {/* Session progress — one line */}
            <div className="flex items-center gap-3">
              <span className="flex-none text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Question <span className="text-slate-900 dark:text-white font-bold">{currentQuestionNumber}</span> of 10
              </span>
              <div className="h-1 flex-1 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentQuestionNumber / 10) * 100)}%` }}
                />
              </div>
              {speaking && (
                <span className="flex-none flex items-center gap-1.5 text-[9px] text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">
                  Speaking
                  <span className="flex items-end gap-0.5 h-2.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 h-full rounded-full bg-indigo-400"
                        style={{ animation: `prepDot 1s ease-in-out ${i * 0.15}s infinite` }}
                      />
                    ))}
                  </span>
                </span>
              )}
            </div>

            {/* Video + transcript */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3">
              <div className="min-w-0">
                <LiveKitCall
                  applicationId={application.id}
                  participantName={userProfile.name || 'Candidate'}
                  transcriptionActive={isListening}
                  interviewerSpeaking={speaking}
                  interviewerQuestion={openingQuestion}
                  companyName={job.companyName}
                />
                <p className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-500 font-medium leading-relaxed px-0.5">
                  Answer in text, tap the mic to speak (transcribed automatically), or record with the mic. Enable voice to hear questions spoken back.
                </p>
              </div>

              {/* Transcript — fills the row height on desktop */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex flex-col h-[440px] lg:h-auto lg:min-h-[420px]">
                <div className="flex-none px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <Video className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    Live Transcript
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-500 font-semibold truncate">
                    {job.companyName} Lead Interviewer
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-500 mb-0.5">
                        <span>{msg.sender === 'user' ? userProfile.name : `${job.companyName} Interviewer`}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'ai' && speechSupported && msg.text && (
                          <button
                            onClick={() => speakMessage(msg.text)}
                            title="Hear this read aloud"
                            className="p-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div
                        className={`p-3 rounded-xl max-w-[94%] text-[11px] leading-relaxed font-medium ${
                          msg.sender === 'user'
                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-900 dark:text-indigo-50 rounded-tr-sm'
                            : 'bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* AI feedback card */}
                        {msg.feedback && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-indigo-600 dark:text-indigo-300">AI Interview Feedback</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                  msg.feedback.rating === 'Excellent'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                }`}
                              >
                                {msg.feedback.rating} ({msg.feedback.score}/100)
                              </span>
                            </div>
                            {msg.feedback.pros.length > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-300 font-semibold leading-relaxed">
                                <strong>Pros:</strong> {msg.feedback.pros.join(', ')}
                              </p>
                            )}
                            {msg.feedback.improvements.length > 0 && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-300/90 font-semibold leading-relaxed">
                                <strong>To Polish:</strong> {msg.feedback.improvements.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAiResponding && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{job.companyName} Interviewer is analyzing your answer…</span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex-none border-t border-slate-200 dark:border-white/10 p-2.5 space-y-2">
                  {sttError && (
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-2.5 py-1.5">
                      <span className="flex-1 min-w-0">{sttError}</span>
                      {audioTx.state === 'recording' ? (
                        <button
                          type="button"
                          onClick={() => void handleRecordClick()}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/90 text-white font-black text-[9px] animate-pulse"
                        >
                          <Square className="w-2.5 h-2.5" />
                          Stop & transcribe
                        </button>
                      ) : audioTx.state === 'transcribing' ? (
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Transcribing…
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleRecordClick()}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500 text-white font-black text-[9px]"
                        >
                          <Mic className="w-2.5 h-2.5" />
                          Record with mic
                        </button>
                      )}
                    </div>
                  )}
                  {audioTx.error && (
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-2.5 py-1.5">
                      {audioTx.error}
                    </p>
                  )}

                  <form onSubmit={handleSendInterviewMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        isListening
                          ? 'Listening — speak your answer…'
                          : 'Type or speak your technical answer here…'
                      }
                      value={
                        isListening
                          ? `${inputMessage}${interimTranscript ? ' ' + interimTranscript : ''}`
                          : inputMessage
                      }
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isAiResponding}
                      className={`flex-1 min-w-0 px-3 py-2 rounded-lg border text-[11px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-[#0A0C12] focus:outline-none transition-colors ${
                        isListening
                          ? 'border-rose-500/60 focus:border-rose-400'
                          : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'
                      }`}
                    />
                    {sttSupported ? (
                      <button
                        type="button"
                        onClick={handleMicClick}
                        disabled={isAiResponding || !sttSupported}
                        title={
                          sttSupported
                            ? isListening
                              ? 'Stop listening'
                              : 'Speak your answer — transcribed to text'
                            : 'Voice input is not supported in this browser'
                        }
                        className={`flex-none p-2 rounded-lg border transition-all disabled:opacity-40 ${
                          isListening
                            ? 'bg-rose-500/90 border-rose-400 text-white animate-pulse'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-500/40'
                        }`}
                      >
                        {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRecordClick()}
                        disabled={isAiResponding || audioTx.state === 'transcribing'}
                        title={
                          audioTx.state === 'recording'
                            ? 'Stop recording and transcribe'
                            : 'Record your answer with the mic'
                        }
                        className={`flex-none p-2 rounded-lg border transition-all disabled:opacity-40 ${
                          audioTx.state === 'recording'
                            ? 'bg-rose-500/90 border-rose-400 text-white animate-pulse'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-500/40'
                        }`}
                      >
                        {audioTx.state === 'recording' ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : audioTx.state === 'transcribing' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mic className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isAiResponding}
                      className="flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[11px] transition-colors disabled:opacity-40 disabled:hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                    >
                      <span className="hidden sm:inline">Submit</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: PRACTICE & RESOURCES (company problems + system design)
        ============================================================ */}
        {activeTab === 'practice' && (
          <div key="practice" className="space-y-3 animate-[prepFadeUp_0.25s_ease_both]">
            {/* Company-specific LeetCode problems */}
            <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-3 animate-[prepFadeUp_0.25s_ease_both]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  {eyebrow('Company Practice', 'text-emerald-600 dark:text-emerald-400')}
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Top problems asked at {job.companyName}
                  </h2>
                  <p className="text-[10px] text-slate-600 dark:text-slate-500 font-medium mt-0.5 max-w-xl">
                    {hasPublicCompanyData
                      ? 'Ranked by reported interview frequency — sourced from company-wise LeetCode data.'
                      : `No public LeetCode data for ${job.companyName} — showing frequently-asked problems from top companies instead.`}
                  </p>
                </div>
                <span className="flex-none text-[10px] text-slate-600 dark:text-slate-500 font-semibold">
                  {visibleProblems.length} problems
                </span>
              </div>

              {/* Difficulty filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setProblemFilter(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                      problemFilter === d
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25'
                    }`}
                  >
                    {d === 'ALL' ? 'All' : d[0] + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Problem list */}
              <div className="space-y-1.5">
                {visibleProblems.map((p, idx) => (
                  <a
                    key={p.link}
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-indigo-500/40 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <span className="flex-none w-5 text-[10px] font-black text-slate-500 dark:text-slate-600 text-right">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                          {p.title}
                        </span>
                        <span
                          className={`flex-none px-1.5 py-0.5 rounded text-[8px] font-black ${difficultyClass(p.difficulty)}`}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                      {p.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.topics.map((t) => (
                            <span key={t} className="text-[9px] font-bold text-slate-600 dark:text-slate-500">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-none flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {p.frequency}%
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* System design questions + resources */}
            <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-3 animate-[prepFadeUp_0.3s_ease_both]">
              <div className="flex flex-wrap items-center gap-2">
                <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <div>
                  {eyebrow('System Design', 'text-sky-600 dark:text-sky-400')}
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Design questions to master</h2>
                </div>
                <a
                  href="https://pagefy.io/system-design/system-design-interview-by-alex-xu"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto flex-none flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-sky-500/40 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Alex Xu question list
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Fundamentals primer */}
              <div className="flex flex-wrap gap-1.5">
                {SYSTEM_DESIGN_FUNDAMENTALS.map((f) => (
                  <a
                    key={f.id}
                    href={f.notesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/25 bg-sky-500/[0.06] text-[10px] font-bold text-sky-600 dark:text-sky-300 hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    {f.title}
                    <ExternalLink className="w-2.5 h-2.5 text-slate-600 dark:text-slate-500" />
                  </a>
                ))}
              </div>

              {/* Question grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {SYSTEM_DESIGN_QUESTIONS.map((q) => (
                  <a
                    key={q.id}
                    href={q.notesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-sky-500/40 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <span className="flex-none w-4 text-[10px] font-black text-sky-500/70 pt-0.5">
                      {String(SYSTEM_DESIGN_QUESTIONS.indexOf(q) + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                          {q.title}
                        </span>
                        <span
                          className={`flex-none px-1.5 py-0.5 rounded text-[8px] font-black ${difficultyClass(q.difficulty as CompanyProblem['difficulty'])}`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.tags.map((t) => (
                          <span key={t} className="text-[9px] font-bold text-slate-600 dark:text-slate-500">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 dark:text-slate-600 group-hover:text-sky-600 dark:group-hover:text-sky-400 flex-none mt-0.5 transition-colors" />
                  </a>
                ))}
              </div>

              {/* Deep-dive resources */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold">
                  Deep-dive resources
                </p>
                {SYSTEM_DESIGN_RESOURCES.map((r) => (
                  <a
                    key={r.title}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 truncate">{r.description}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-600 dark:text-slate-500 flex-none" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================
            TAB 3: INSIGHTS & QUESTIONS (dense 2-column)
        ============================================================ */}
        {activeTab === 'insights' && (
          <div key="insights" className="space-y-3 animate-[prepFadeUp_0.25s_ease_both]">
            {!insights && insightsStatus !== 'GENERATING' ? (
              emptyState({
                label: 'Company Intelligence',
                title:
                  insightsStatus === 'FAILED'
                    ? 'Unable to generate insights'
                    : 'Your company briefing is waiting.',
                description:
                  insightsStatus === 'FAILED'
                    ? `The AI service couldn't complete the request for ${job.companyName}. Try again in a moment.`
                    : `Everything you should know before interviewing at ${job.companyName} — interview process, culture, tech stack, and likely questions.`,
                actionLabel:
                  insightsStatus === 'FAILED'
                    ? 'Try Again'
                    : isGeneratingInsights
                      ? 'Researching…'
                      : 'Generate Insights',
                onAction: handleGenerateInsightsClick,
                busy: isGeneratingInsights,
                accent: 'sky',
              })
            ) : !insights && (insightsStatus === 'GENERATING' || isGeneratingInsights) ? (
              generationChecklist(INSIGHTS_CHECKLIST, 'Company Intelligence', job.companyName)
            ) : insights ? (
              <div className="space-y-3">
                {/* Hero strip */}
                <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-2.5 animate-[prepFadeUp_0.25s_ease_both]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">{eyebrow('Company Intelligence', 'text-sky-600 dark:text-sky-400')}</div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Everything you should know before interviewing at{' '}
                      <span className="text-sky-600 dark:text-sky-300">{insights.companyName}</span>.
                    </h2>
                  </div>
                  {job.tags.length > 0 && (
                    <div className="ml-auto flex flex-wrap gap-1">
                      {job.tags.slice(0, 8).map((t) => (
                        <span key={t}>{chip(t, true)}</span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Dense 2-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Company overview + tech stack */}
                  <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2.5 animate-[prepFadeUp_0.3s_ease_both]">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <h3 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Company Overview
                      </h3>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{insights.overview}</p>
                    {insights.techStack.length > 0 && (
                      <div className="pt-1.5 border-t border-white/[0.06]">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                          <Wrench className="w-3 h-3" /> Technology Stack
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {insights.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Interview process */}
                  {insights.interviewProcess.length > 0 && (
                    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2.5 animate-[prepFadeUp_0.35s_ease_both]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Interview Process
                        </h3>
                      </div>
                      <div className="relative space-y-1.5">
                        <div className="absolute left-[9px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" />
                        {insights.interviewProcess.map((stage, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className="relative z-10 flex-none w-5 h-5 rounded-full border border-indigo-500/40 bg-white dark:bg-[#0A0C12] text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black">
                              {idx + 1}
                            </span>
                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-snug pt-0.5">
                              {stage}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Culture & values */}
                  <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2.5 animate-[prepFadeUp_0.4s_ease_both]">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Culture & Values
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {(insights.keyProductInsights.length > 0
                        ? insights.keyProductInsights
                        : FALLBACK_INSIGHTS
                      ).map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-500/15 bg-amber-500/[0.05] text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400/80 flex-none mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Prep tips */}
                  {insights.prepTips.length > 0 && (
                    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2.5 animate-[prepFadeUp_0.45s_ease_both]">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Preparation Tips
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {insights.prepTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-none mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Likely interview questions — full width */}
                <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2.5 animate-[prepFadeUp_0.5s_ease_both]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Likely Interview Questions
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                    {(insights.sampleQuestions.length > 0
                      ? insights.sampleQuestions
                      : FALLBACK_QUESTIONS
                    ).map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors group"
                      >
                        <span className="flex-none text-[10px] font-black text-indigo-600 dark:text-indigo-400 pt-0.5 w-5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                          {q}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
