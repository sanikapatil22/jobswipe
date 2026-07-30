'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, Heart, Bookmark, RotateCcw, Sparkles } from 'lucide-react';
import type { PanInfo } from 'motion/react';
import { Job, UserProfile } from '@/types';
import { JobCard } from './JobCard';
import { DirectApplyModal } from './DirectApplyModal';

interface DiscoveryViewProps {
  jobs: Job[];
  userProfile: UserProfile;
  onApplyJob: (job: Job) => void;
  onSaveJob: (job: Job) => void;
  onDiscardJob: (job: Job) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  jobs,
  userProfile,
  onApplyJob,
  onSaveJob,
  onDiscardJob,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ job: Job; action: 'applied' | 'saved' | 'discarded' }[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Direct Apply Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetJobForModal, setTargetJobForModal] = useState<Job | null>(null);

  // Motion Value for Drag Swiping
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);
  const applyOpacity = useTransform(x, [20, 120], [0, 1]);

  // Filter jobs based on controls
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'remote') return j.workType === 'Remote';
    if (filterType === 'hybrid') return j.workType === 'Hybrid';
    if (filterType === 'top_match') return j.staticMatchScore >= 90;
    return true;
  });

  const activeStack = filteredJobs.slice(currentIndex);
  const currentJob = activeStack[0];

  // Action handlers
  const handleNext = (action: 'applied' | 'saved' | 'discarded') => {
    if (!currentJob) return;

    if (action === 'applied') {
      // Open modal to confirm 1-Click direct apply using profile & resume details
      setTargetJobForModal(currentJob);
      setIsModalOpen(true);
      return;
    } else if (action === 'saved') {
      onSaveJob(currentJob);
    } else {
      onDiscardJob(currentJob);
    }

    setHistory((prev) => [...prev, { job: currentJob, action }]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleConfirmDirectApply = (jobToApply: Job) => {
    onApplyJob(jobToApply);
    setHistory((prev) => [...prev, { job: jobToApply, action: 'applied' }]);
    setCurrentIndex((prev) => prev + 1);
    setIsModalOpen(false);
    setTargetJobForModal(null);
  };

  const handleUndo = () => {
    if (currentIndex <= 0 || history.length === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setHistory([]);
  };

  // Drag Gesture End Handler
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 300) {
      // Swiped Right -> Open 1-Click Direct Apply Modal
      setTargetJobForModal(currentJob);
      setIsModalOpen(true);
    } else if (offset < -100 || velocity < -300) {
      // Swiped Left -> Pass / Discard
      handleNext('discarded');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 px-4 flex flex-col items-center justify-between">
      
      {/* Search & Filter Header Bar */}
      <div className="w-full max-w-xl mx-auto mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search roles, companies, or stack (e.g. React, Stripe)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-slate-200 text-xs w-full sm:w-auto overflow-x-auto shadow-sm">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('top_match')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
              filterType === 'top_match'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            🔥 90%+ Match
          </button>
          <button
            onClick={() => setFilterType('remote')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors ${
              filterType === 'remote'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Remote
          </button>
        </div>
      </div>

      {/* Main Interactive Card Stack Area */}
      <div className="relative w-full max-w-md h-[580px] flex items-center justify-center">
        {currentJob ? (
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Background Z-Index Cards preview */}
            {activeStack.slice(1, 3).map((bgJob, offsetIdx) => {
              const scale = 1 - (offsetIdx + 1) * 0.04;
              const translateY = (offsetIdx + 1) * 12;
              return (
                <div
                  key={bgJob.id}
                  style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    zIndex: 10 - offsetIdx - 1,
                  }}
                  className="absolute inset-0 pointer-events-none opacity-60 filter blur-[0.5px] transition-all duration-300"
                >
                  <JobCard
                    job={bgJob}
                    userProfile={userProfile}
                    isFront={false}
                    onApply={() => {}}
                    onSave={() => {}}
                    onDiscard={() => {}}
                  />
                </div>
              );
            })}

            {/* Top Interactive Front Card with Touch & Mouse Swipe Drag */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJob.id}
                style={{ x, rotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing touch-none select-none"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Visual Stamp Overlay Indicators on Drag */}
                <motion.div
                  style={{ opacity: applyOpacity }}
                  className="absolute top-8 left-8 z-30 pointer-events-none px-5 py-2.5 rounded-2xl border-4 border-emerald-500 bg-emerald-500/90 text-white font-black text-xl tracking-wider shadow-xl transform -rotate-12"
                >
                  APPLY NOW 🚀
                </motion.div>

                <motion.div
                  style={{ opacity: passOpacity }}
                  className="absolute top-8 right-8 z-30 pointer-events-none px-5 py-2.5 rounded-2xl border-4 border-rose-500 bg-rose-500/90 text-white font-black text-xl tracking-wider shadow-xl transform rotate-12"
                >
                  PASS ✕
                </motion.div>

                <JobCard
                  job={currentJob}
                  userProfile={userProfile}
                  isFront={true}
                  onApply={() => handleNext('applied')}
                  onSave={() => handleNext('saved')}
                  onDiscard={() => handleNext('discarded')}
                />
              </motion.div>
            </AnimatePresence>

          </div>
        ) : (
          /* Empty Stack State */
          <div className="w-full h-full rounded-[36px] bg-white border-4 border-slate-900 p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Stack Completed!</h3>
            <p className="text-xs text-slate-600 font-medium max-w-xs mb-6">
              You&apos;ve reviewed all active tech roles matching your current filter criteria.
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

      {/* Swipe Controls Bar */}
      {currentJob && (
        <div className="w-full max-w-md mx-auto mt-6 flex items-center justify-between gap-3 px-2">
          
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={currentIndex === 0}
            title="Undo last swipe"
            className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-900 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Pass / Discard Button */}
          <button
            onClick={() => handleNext('discarded')}
            title="Pass / Discard Role"
            className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-rose-50 border-2 border-slate-900 text-slate-900 hover:text-rose-600 flex items-center justify-center gap-2 font-black text-xs transition-all shadow-md"
          >
            <X className="w-5 h-5 text-rose-600" />
            <span>Pass</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => handleNext('saved')}
            title="Save to My Companies"
            className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 hover:bg-amber-50 text-amber-600 flex items-center justify-center transition-all shadow-md"
          >
            <Bookmark className="w-5 h-5 text-amber-600" />
          </button>

          {/* Single Primary Apply Button */}
          <button
            onClick={() => handleNext('applied')}
            title="Apply directly with Profile & Resume"
            className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 active:scale-95"
          >
            <Heart className="w-5 h-5 fill-current text-white" />
            <span>APPLY NOW</span>
          </button>

        </div>
      )}

      {/* Footer Instructions Hint */}
      <div className="text-xs font-semibold text-slate-500 mt-4 text-center">
        Swipe cards left/right or click <strong className="text-indigo-600 font-extrabold">APPLY NOW</strong> to send 1-Click applications with profile & resume details.
      </div>

      {/* 1-Click AI Direct Apply Modal */}
      {targetJobForModal && (
        <DirectApplyModal
          job={targetJobForModal}
          userProfile={userProfile}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTargetJobForModal(null);
          }}
          onConfirmApply={handleConfirmDirectApply}
        />
      )}

    </div>
  );
};
