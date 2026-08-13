'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  ArrowUpRight,
  Bookmark,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import type { PanInfo } from 'motion/react';
import { Job, UserProfile } from '@/types';
import { JobCard } from './JobCard';
import { FilterSidebar } from './FilterSidebar';
import { countActiveFilters, type DiscoverFacets, type DiscoverFilters } from '@/lib/jobs/filters';

interface DiscoveryViewProps {
  jobs: Job[];
  userProfile: UserProfile;
  filters: DiscoverFilters;
  facets: DiscoverFacets | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onFiltersChange: (filters: DiscoverFilters) => void;
  onClearFilters: () => void;
  onLoadMore: () => void;
  onInterestedJob: (job: Job) => void;
  onPassJob: (job: Job) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  jobs,
  userProfile,
  filters,
  facets,
  loading,
  loadingMore,
  hasMore,
  onFiltersChange,
  onClearFilters,
  onLoadMore,
  onInterestedJob,
  onPassJob,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState<null | 'saved' | 'passed'>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);
  const saveOpacity = useTransform(x, [20, 120], [0, 1]);

  // Clamp the swipe position against the loaded feed (grows via pagination,
  // resets when a filter change swaps the result set).
  const clampedIndex = Math.min(currentIndex, Math.max(0, jobs.length - 1));
  const activeStack = jobs.slice(clampedIndex);
  const currentJob = activeStack[0];

  const prevFirstId = useRef<string | null>(null);
  useEffect(() => {
    const firstId = jobs[0]?.id ?? null;
    if (firstId !== prevFirstId.current) {
      setCurrentIndex(0);
    }
    prevFirstId.current = firstId;
  }, [jobs]);

  // Keep the motion value in sync when the card changes.
  useEffect(() => {
    x.set(0);
    setSwipeFeedback(null);
  }, [currentJob?.id, x]);

  useEffect(() => {
    if (!swipeFeedback) return;
    const timer = window.setTimeout(() => setSwipeFeedback(null), 700);
    return () => window.clearTimeout(timer);
  }, [swipeFeedback]);

  // Infinite feed: pull the next page as the user nears the end of the stack.
  useEffect(() => {
    if (hasMore && !loadingMore && jobs.length > 0 && clampedIndex >= jobs.length - 4) {
      onLoadMore();
    }
  }, [clampedIndex, jobs.length, hasMore, loadingMore, onLoadMore]);

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
    x.set(0);
  };

  const activeFilterCount = countActiveFilters(filters);
  const noMatches = !loading && jobs.length === 0;

  const filterPanel = (
    <FilterSidebar
      filters={filters}
      onChange={onFiltersChange}
      onClear={onClearFilters}
      facets={facets}
    />
  );

  return (
    <div className="relative h-[calc(100dvh-5rem)] overflow-hidden bg-slate-50 flex">
      {/* ===== Desktop: filters in the left sidebar ===== */}
      <aside className="hidden lg:flex flex-col w-[300px] xl:w-[320px] flex-none border-r border-slate-200 bg-white/70 backdrop-blur-sm">
        <div className="flex-none px-5 pt-5 pb-3 border-b border-slate-100">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Narrow the feed to roles worth your time.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2">{filterPanel}</div>
      </aside>

      {/* ===== Mobile: filters drawer ===== */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-2xl flex flex-col"
            >
              <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">{filterPanel}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Main area: header + vertical card deck ===== */}
      <main className="flex-1 min-w-0 flex flex-col items-center px-4 py-4 sm:py-6 gap-3 sm:gap-4 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-indigo-100/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl" />

        <div className="relative w-full max-w-2xl xl:max-w-3xl mx-auto flex flex-col gap-2 sm:gap-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Discover</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 leading-tight">
                Swipe through live jobs
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-none">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleReset}
                title="Reset the card stack"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset cards</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, roles, or keywords..."
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm transition-colors"
            />
          </div>

          <div className="hidden lg:flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {jobs.length} active roles
            </span>
            {filters.q.trim() && (
              <button
                onClick={() => onFiltersChange({ ...filters, q: '' })}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
              >
                <X className="w-3 h-3" />
                Clear search
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full max-w-2xl xl:max-w-3xl flex-1 min-h-0 flex items-center justify-center">
          <AnimatePresence>
            {swipeFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className={`absolute top-2 right-2 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black shadow-lg backdrop-blur-sm ${
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

          <div className="relative w-full h-full">
            {loading && jobs.length === 0 ? (
              <div className="w-full h-full rounded-[2.5rem] bg-white/95 backdrop-blur border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <SlidersHorizontal className="w-8 h-8 text-indigo-600 animate-pulse mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Finding matching roles…</h3>
                <p className="text-sm text-slate-600 font-medium max-w-xs">
                  Applying your filters to live openings.
                </p>
              </div>
            ) : noMatches ? (
              <div className="w-full h-full rounded-[2.5rem] bg-white/95 backdrop-blur border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No roles match your current filters</h3>
                <p className="text-sm text-slate-600 font-medium max-w-md mb-6">
                  {activeFilterCount > 0
                    ? 'Try removing a filter or two to widen the search.'
                    : 'No live openings found right now. Reset to start over.'}
                </p>
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-200 transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : currentJob ? (
              <div className="relative w-full h-full">
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
                      className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-55 blur-[0.5px] transition-all duration-300"
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
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
                    initial={{ scale: 0.95, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }}
                  >
                    <motion.div
                      style={{ opacity: saveOpacity }}
                      className="absolute top-6 left-6 z-30 pointer-events-none inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 shadow-[0_10px_30px_rgba(16,185,129,0.18)]"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-600" />
                      <span>Saved</span>
                    </motion.div>

                    <motion.div
                      style={{ opacity: passOpacity }}
                      className="absolute top-6 right-6 z-30 pointer-events-none inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                      <span>Passed</span>
                    </motion.div>

                    <JobCard job={currentJob} userProfile={userProfile} vertical />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="w-full h-full rounded-[2.5rem] bg-white/95 backdrop-blur border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {loadingMore ? 'Loading more roles…' : 'You&apos;ve seen every matching card'}
                </h3>
                <p className="text-sm text-slate-600 font-medium max-w-md mb-6">
                  {loadingMore
                    ? 'Fetching the next page of matches.'
                    : 'Everything matching your filters has been reviewed. Reset cards to start over, or widen your filters.'}
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
          <div className="relative w-full max-w-2xl xl:max-w-3xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span className="hidden sm:inline">Swipe right to save the role.</span>
              <span>
                {clampedIndex + 1} / {jobs.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => void handleAdvance('pass')}
                title="Pass this role"
                className="h-12 sm:h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 flex items-center justify-center gap-2 font-black text-xs transition-all shadow-sm hover:border-rose-200 hover:text-rose-600"
              >
                <X className="w-5 h-5 text-rose-500" />
                <span>Pass</span>
              </button>

              <button
                onClick={() => void handleAdvance('interested')}
                title="Save to Interested"
                className="h-12 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 font-black text-xs transition-all shadow-lg shadow-emerald-100"
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
                className={`h-12 sm:h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs transition-all shadow-sm ${
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

        <div className="relative text-xs font-semibold text-slate-500 mt-1 text-center max-w-2xl leading-relaxed hidden md:block">
          Right swipe saves the role to Interested and immediately advances to the next card. Apply only when you&apos;re ready from the Interested hub.
        </div>
      </main>
    </div>
  );
};
