'use client';
import React, { useState } from 'react';
import { 
  ArrowLeft, Sparkles, CheckCircle2, Circle, Send, MessageSquare, 
  ExternalLink, BookOpen, Award, Lightbulb, RefreshCw
} from 'lucide-react';
import { Application, MockInterviewMessage, UserProfile } from '@/types';

interface CompanyPrepDetailProps {
  application: Application;
  userProfile: UserProfile;
  onClose: () => void;
  onGenerateRoadmap: (appId: string) => Promise<void>;
  onUpdateTaskCompletion: (appId: string, stepId: string, taskId: string, completed: boolean) => void;
}

export const CompanyPrepDetail: React.FC<CompanyPrepDetailProps> = ({
  application,
  userProfile,
  onClose,
  onGenerateRoadmap,
  onUpdateTaskCompletion,
}) => {
  const { job, roadmap, roadmapStatus } = application;
  const [activeTab, setActiveTab] = useState<'roadmap' | 'interview' | 'insights'>('roadmap');
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(
    roadmapStatus === 'GENERATING'
  );

  // AI Mock Interview Chat state
  const [chatMessages, setChatMessages] = useState<MockInterviewMessage[]>([
    {
      id: 'msg_init',
      sender: 'ai',
      text: `Welcome to your mock interview for the ${job.role} position at ${job.companyName}! Let's start with a classic technical challenge: "How would you design a rate limiter or handle idempotent API payment requests?" Walk me through your approach step-by-step.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Compute total task progress
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
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Trigger roadmap generation if not present
  const handleGenerateClick = async () => {
    setIsGeneratingRoadmap(true);
    try {
      await onGenerateRoadmap(application.id);
    } finally {
      setIsGeneratingRoadmap(false);
    }
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
          targetQuestion:
            roadmap?.sampleQuestions?.[0] ||
            'Explain your technical approach to building scalable web APIs.',
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
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: payload.reply || m.text.replace(/```json[\s\S]*?```/g, '').trim(),
                      feedback,
                    }
                  : m
              )
            );
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col text-slate-900">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{job.companyName}</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                {application.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">{job.role} • AI Prep Hub</p>
          </div>
        </div>

        {/* Global Progress Gauge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-700">
              Prep Readiness: <strong className="text-emerald-700 font-black">{progressPercent}%</strong>
            </span>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-colors"
          >
            <span>Open Application</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-200 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Roadmap & Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'interview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            <span>AI Mock Interview Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-300" />
            <span>Company Insights & Qs</span>
          </button>
        </div>

        {/* --- TAB 1: AI ROADMAP & BITE-SIZED TASKS --- */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            
            {/* Generate or Regenerate Roadmap Banner */}
            {!roadmap && roadmapStatus !== 'GENERATING' ? (
              <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {roadmapStatus === 'FAILED'
                    ? 'Roadmap Generation Failed'
                    : 'Generate Company Specific AI Roadmap'}
                </h3>
                <p className="text-xs font-semibold text-slate-600 max-w-md mb-6 leading-relaxed">
                  Gemini will analyze {job.companyName}&apos;s role requirements, tech stack, and recent interview
                  reports to generate a 4-phase prep plan.
                </p>
                <button
                  onClick={handleGenerateClick}
                  disabled={isGeneratingRoadmap}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGeneratingRoadmap
                      ? 'Building Custom Roadmap...'
                      : roadmapStatus === 'FAILED'
                        ? 'Retry AI Roadmap'
                        : 'Generate AI Roadmap Now'}
                  </span>
                </button>
              </div>
            ) : !roadmap && (roadmapStatus === 'GENERATING' || isGeneratingRoadmap) ? (
              <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Generating Your Roadmap…</h3>
                <p className="text-xs font-semibold text-slate-600 max-w-md">
                  This runs as a background job. This page will update when Gemini finishes.
                </p>
              </div>
            ) : roadmap ? (
              <div className="space-y-6">
                
                {/* Overall Strategic Focus Box */}
                <div className="p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-none mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">AI Strategic Focus</h4>
                    <p className="text-xs text-slate-700 mt-1 font-bold">{roadmap.overallFocus}</p>
                  </div>
                </div>

                {/* Stepper Header Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {roadmap.steps.map((step, idx) => {
                    const stepDoneCount = step.tasks.filter((t) => t.completed).length;
                    const stepTotal = step.tasks.length;
                    const isSelected = selectedStepIndex === idx;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStepIndex(idx)}
                        className={`p-4 rounded-2xl text-left border-2 transition-all ${
                          isSelected
                            ? 'bg-white border-indigo-600 shadow-md'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-black text-indigo-600">Phase {step.stepNumber}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{step.estimatedMinutes} mins</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-xs line-clamp-1 mb-1">{step.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mb-3">{step.subtitle}</p>

                        <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                          <span>{stepDoneCount}/{stepTotal} Tasks</span>
                          <span className="text-emerald-700">{Math.round((stepDoneCount / (stepTotal || 1)) * 100)}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Phase Detail Tasks */}
                {roadmap.steps[selectedStepIndex] && (
                  <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-6 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-black bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200">
                          Phase {roadmap.steps[selectedStepIndex].stepNumber}
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {roadmap.steps[selectedStepIndex].title}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {roadmap.steps[selectedStepIndex].subtitle}
                      </p>
                    </div>

                    {/* Bite-Sized Duolingo Checkable Tasks */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Actionable Practice Tasks
                      </h4>

                      <div className="space-y-2">
                        {roadmap.steps[selectedStepIndex].tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() =>
                              onUpdateTaskCompletion(
                                application.id,
                                roadmap.steps[selectedStepIndex].id,
                                task.id,
                                !task.completed
                              )
                            }
                            className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                              task.completed
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400 flex-none" />
                              )}
                              <span className={`text-xs font-bold ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </span>
                            </div>

                            <span className="px-2.5 py-1 text-[10px] font-black bg-slate-100 text-slate-600 rounded-lg">
                              {task.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Resources */}
                    {roadmap.steps[selectedStepIndex].resources.length > 0 && (
                      <div className="pt-4 border-t-2 border-slate-100">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                          Recommended Study Links
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {roadmap.steps[selectedStepIndex].resources.map((res, idx) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-indigo-600 hover:border-indigo-500 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{res.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            ) : null}

          </div>
        )}

        {/* --- TAB 2: AI MOCK INTERVIEW SIMULATOR --- */}
        {activeTab === 'interview' && (
          <div className="flex-1 rounded-3xl bg-white border-2 border-slate-200 p-4 sm:p-6 flex flex-col h-[520px] shadow-sm">
            
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 mb-1">
                    <span>{msg.sender === 'user' ? userProfile.name : `${job.companyName} Lead Interviewer`}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed font-semibold ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-100 border-2 border-slate-200 text-slate-900 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* AI Feedback evaluation card if present */}
                    {msg.feedback && (
                      <div className="mt-3 pt-3 border-t-2 border-slate-200 bg-white p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-indigo-600">AI Interview Feedback</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                              msg.feedback.rating === 'Excellent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {msg.feedback.rating} ({msg.feedback.score}/100)
                          </span>
                        </div>

                        {msg.feedback.pros.length > 0 && (
                          <div className="text-[11px] text-emerald-700 font-bold">
                            <strong>Pros:</strong> {msg.feedback.pros.join(', ')}
                          </div>
                        )}

                        {msg.feedback.improvements.length > 0 && (
                          <div className="text-[11px] text-amber-800 font-bold">
                            <strong>To Polish:</strong> {msg.feedback.improvements.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiResponding && (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-slate-100 p-3 rounded-2xl w-fit border-2 border-slate-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>{job.companyName} Interviewer is analyzing your answer...</span>
                </div>
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendInterviewMessage} className="mt-4 flex items-center gap-2 pt-3 border-t-2 border-slate-100">
              <input
                type="text"
                placeholder="Type your technical answer or explanation here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isAiResponding}
                className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isAiResponding}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-sm"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        )}

        {/* --- TAB 3: INSIGHTS & SAMPLE INTERVIEW QUESTIONS --- */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            
            {/* Real Interview Questions List */}
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-black text-xs text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Frequently Asked Interview Questions at {job.companyName}</span>
              </h3>

              <div className="space-y-3">
                {(roadmap?.sampleQuestions || [
                  `How do you handle race conditions or idempotency in ${job.companyName}'s API infrastructure?`,
                  `Describe a complex React/TypeScript state bug you debugged recently.`,
                  `Explain the internal trade-offs between SQL transactions and Redis caching.`,
                  `Why ${job.companyName} over other tech companies in this sector?`,
                ]).map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-800">
                    <span className="font-black text-indigo-600 mr-2">Q{idx + 1}:</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product & Tech Stack Insights */}
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-black text-xs text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Engineering Culture & Product Insights</span>
              </h3>

              <div className="space-y-3">
                {(roadmap?.keyProductInsights || [
                  `${job.companyName} values extreme velocity combined with API consistency.`,
                  `High emphasis on automated CI/CD testing and developer ergonomics.`,
                  `System design interviews test real production edge cases rather than theoretical trivia.`,
                ]).map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-none mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
