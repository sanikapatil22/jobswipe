'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny wrapper around the browser Web Speech API (SpeechSynthesis).
 * Zero-dependency TTS so the AI interviewer can speak its questions out loud.
 */
export function useSpeechSynthesis() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [enabled, setEnabledState] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (!value && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip code fences / JSON so the interviewer reads like a person, not a linter.
    const clean = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[{}[\]]|"rating"|"score"|"pros"|"improvements"/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          /samantha|zira|female|google us english|aria/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith('en-US')) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Warm up voice list (loads asynchronously in some browsers).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return { supported, enabled, setEnabled, speak, stop, speaking };
}
