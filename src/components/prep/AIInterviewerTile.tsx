'use client';

import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';

interface AIInterviewerTileProps {
  companyName: string;
  /** Interviewer TTS is actively speaking — waveform animates. */
  speaking: boolean;
  /** Candidate is dictating an answer — interviewer shows listening state. */
  listening: boolean;
  /** Current question, shown as a caption at the bottom of the tile. */
  question?: string;
}

/**
 * Animated "AI interviewer" video tile. Replaces the black remote-video tile
 * in the mock-interview video room: a gradient studio backdrop, a pulsing
 * avatar, a voice-activity waveform synced to TTS, and the live question.
 */
export const AIInterviewerTile: React.FC<AIInterviewerTileProps> = ({
  companyName,
  speaking,
  listening,
  question,
}) => {
  const status = speaking ? 'Speaking…' : listening ? 'Listening to your answer…' : 'Ready';

  return (
    <div className="relative w-full h-full aspect-video rounded-xl overflow-hidden select-none">
      <style>{`
        @keyframes interviewerGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes interviewerWave { 0%,100%{transform:scaleY(0.25)} 50%{transform:scaleY(1)} }
        @keyframes interviewerRing { 0%{transform:scale(0.9);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
      `}</style>

      {/* Animated gradient studio backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 bg-[length:200%_200%]"
        style={{ animation: 'interviewerGradient 9s ease-in-out infinite' }}
      />
      {/* Soft light vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%), radial-gradient(ellipse at 75% 85%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 50%)',
        }}
      />

      {/* Center avatar + waveform */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="relative flex items-center justify-center">
          {(speaking || listening) && (
            <>
              <span
                className="absolute inset-0 rounded-full border-2 border-white/50"
                style={{ animation: 'interviewerRing 1.8s ease-out infinite' }}
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-white/30"
                style={{ animation: 'interviewerRing 1.8s ease-out 0.6s infinite' }}
              />
            </>
          )}
          <div
            className={`w-16 h-16 rounded-full bg-white/15 border-2 border-white/50 backdrop-blur flex items-center justify-center text-white shadow-xl transition-transform duration-300 ${
              speaking ? 'scale-110' : listening ? 'scale-105' : ''
            }`}
          >
            <Sparkles className="w-7 h-7" />
          </div>
        </div>

        {/* Voice-activity waveform */}
        <div className="flex items-end gap-1 h-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-white/90 origin-bottom"
              style={{
                height: '100%',
                animation: speaking ? `interviewerWave 0.8s ease-in-out ${i * 0.12}s infinite` : 'none',
                transform: speaking ? undefined : 'scaleY(0.22)',
                opacity: speaking ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        <div className="text-center px-3">
          <p className="text-white text-xs font-black flex items-center justify-center gap-1.5">
            <Volume2 className="w-3 h-3 text-white/70" />
            {companyName} AI Interviewer
          </p>
          <p className="text-white/70 text-[10px] font-bold mt-0.5">{status}</p>
        </div>
      </div>

      {/* Live question caption */}
      {question && (
        <div className="absolute bottom-2 left-2 right-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur">
          <p className="text-white/90 text-[10px] font-bold leading-snug line-clamp-2">
            {question}
          </p>
        </div>
      )}

      {/* Top-left label */}
      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/40 text-white/85 text-[9px] font-black tracking-wide">
        AI INTERVIEWER
      </span>
    </div>
  );
};
