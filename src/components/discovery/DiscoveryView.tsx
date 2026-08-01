'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ArrowUpRight, Bookmark, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import type { PanInfo } from 'motion/react';
import { Job, UserProfile } from '@/types';
import { JobCard } from './JobCard';

interface DiscoveryViewProps {
  jobs: Job[];
  userProfile: UserProfile;
  onInterestedJob: (job: Job) => void;
  onPassJob: (job: Job) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  jobs,
  userProfile,
  onInterestedJob,
  onPassJob,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [swipeFeedback, setSwipeFeedback] = useState<null | 'saved' | 'passed'>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);
  const saveOpacity = useTransform(x, [20, 120], [0, 1]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const query = searchQuery.toLowerCase();
        return (
          job.companyName.toLowerCase().includes(query) ||
          job.role.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          job.description.toLowerCase().includes(query)
        );
      }),
    [jobs, searchQuery]
  );

  const activeStack = filteredJobs.slice(currentIndex);
  const currentJob = activeStack[0];

  useEffect(() => {
    x.set(0);
    setSwipeFeedback(null);
  }, [currentJob?.id, x]);

  useEffect(() => {
    if (!swipeFeedback) return;
    const timer = window.setTimeout(() => setSwipeFeedback(null), 700);
    return () => window.clearTimeout(timer);
  }, [swipeFeedback]);

  const handleAdvance = async (action: 'interested' | 'pass') => {
    if (!currentJob) return;

    if (action === 'interested') {
      setSwipeFeedback('saved');
      await onInterestedJob(currentJob);
    } else {
      setSwipeFeedback('passed');
      await onPassJob(currentJob);
    }

    setCurrentIndex((prev) => prev + 1);
    x.set(0);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 300) {
      void handleAdvance('interested');
    } else if (offset < -100 || velocity < -300) {
      void handleAdvance('pass');
    } else {
      x.set(0);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSearchQuery('');
    x.set(0);
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-50 px-4 py-8 flex flex-col items-center gap-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-indigo-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl" />
      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Discover</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Swipe through live jobs</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Real openings from Greenhouse and Lever only. Swipe right to save a role to Interested, then keep moving.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{filteredJobs.length} active roles</span>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset cards</span>
            </button>
          </div>
        </div>

        <div className="relative max-w-xl w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies, roles, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm transition-colors"
          />
        </div>
      </div>

      <div className="relative w-full max-w-4xl flex-1 min-h-0 flex items-center justify-center">
        <AnimatePresence>
          {swipeFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className={`absolute top-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black shadow-lg backdrop-blur-sm ${
                swipeFeedback === 'saved'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 shadow-slate-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${swipeFeedback === 'saved' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{swipeFeedback === 'saved' ? 'Saved' : 'Passed'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full h-full flex items-center justify-center">
          {currentJob ? (
            <div className="relative w-full h-full flex items-center justify-center">
            {activeStack.slice(1, 3).map((bgJob, offsetIdx) => {
              const scale = 1 - (offsetIdx + 1) * 0.045;
              const translateY = (offsetIdx + 1) * 14;
              return (
                <div
                  key={bgJob.id}
                  style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    zIndex: 10 - offsetIdx - 1,
                  }}
                  className="absolute inset-0 pointer-events-none opacity-55 blur-[0.5px] transition-all duration-300"
                >
                  <JobCard job={bgJob} userProfile={userProfile} compact />
                </div>
              );
            })}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentJob.id}
                style={{ x, rotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing touch-none select-none"
                initial={{ scale: 0.95, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }}
              >
                <motion.div
                  style={{ opacity: saveOpacity }}
                  className="absolute top-8 left-8 z-30 pointer-events-none inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 shadow-[0_10px_30px_rgba(16,185,129,0.18)]"
                >
                  <Bookmark className="w-4 h-4 text-emerald-600" />
                  <span>Saved</span>
                </motion.div>

                <motion.div
                  style={{ opacity: passOpacity }}
                  className="absolute top-8 right-8 z-30 pointer-events-none inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                >
                  <X className="w-4 h-4 text-slate-500" />
                  <span>Passed</span>
                </motion.div>

                <JobCard job={currentJob} userProfile={userProfile} />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full h-full rounded-4xl bg-white/95 backdrop-blur border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No more cards</h3>
            <p className="text-sm text-slate-600 font-medium max-w-md mb-6">
              Everything currently in the database has been reviewed for this filter. Use Reset cards to start over, or sync new jobs for fresh openings.
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-200 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset & Review Cards</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {currentJob && (
        <div className="w-full max-w-3xl mx-auto mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Swipe right or tap Interested to save the role.</span>
            <span>
              {currentIndex + 1} / {filteredJobs.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => void handleAdvance('pass')}
              title="Pass this role"
              className="h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 flex items-center justify-center gap-2 font-black text-xs transition-all shadow-sm hover:border-rose-200 hover:text-rose-600"
            >
              <X className="w-5 h-5 text-rose-500" />
              <span>Pass</span>
            </button>

            <button
              onClick={() => void handleAdvance('interested')}
              title="Save to Interested"
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 font-black text-xs transition-all shadow-lg shadow-emerald-100"
            >
              <Bookmark className="w-5 h-5 fill-current" />
              <span>Interested</span>
            </button>

            <a
              href={currentJob.applyUrl || undefined}
              target="_blank"
              rel="noreferrer"
              title="Open official posting"
              aria-disabled={!currentJob.applyUrl}
              onClick={(event) => {
                if (!currentJob.applyUrl) {
                  event.preventDefault();
                }
              }}
              className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs transition-all shadow-sm ${
                currentJob.applyUrl
                  ? 'bg-white border-slate-200 text-slate-900 hover:border-indigo-200 hover:text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 text-indigo-600" />
              <span>{currentJob.applyUrl ? 'Apply' : 'Application unavailable'}</span>
            </a>
          </div>
        </div>
      )}

      <div className="text-xs font-semibold text-slate-500 mt-4 text-center max-w-2xl leading-relaxed">
        Right swipe saves the role to Interested and immediately advances to the next card. Apply only when you&apos;re ready from the Interested hub.
      </div>
    </div>
  );
};
