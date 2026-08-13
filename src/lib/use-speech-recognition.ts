'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    [index: number]: { transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as SpeechRecognitionWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const FATAL_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
  'language-not-supported',
]);

/**
 * Browser SpeechRecognition (webkitSpeechRecognition) wrapper.
 * Transcribes the candidate's spoken answer into text for the mock interview.
 *
 * Chrome frequently drops recognition sessions without warning, so `onend`
 * auto-restarts when the user still wants to listen, and transient errors
 * (`no-speech`, `aborted`) retry once. Fatal errors (`not-allowed`,
 * `audio-capture` — e.g. mic held by the LiveKit call) stop and surface a
 * human-readable reason.
 */
export function useSpeechRecognition() {
  const supported = getSpeechRecognition() !== null;

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef<(text: string) => void>(() => undefined);
  const wantsListeningRef = useRef(false);
  const restartScheduledRef = useRef(false);

  const cleanup = useCallback(() => {
    recRef.current = null;
    setListening(false);
    setInterim('');
  }, []);

  const stop = useCallback(() => {
    wantsListeningRef.current = false;
    try {
      recRef.current?.abort();
      recRef.current?.stop();
    } catch {
      // already stopped
    }
    cleanup();
  }, [cleanup]);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      if (!supported) return;

      const Ctor = getSpeechRecognition();
      if (!Ctor) return;

      stop();
      wantsListeningRef.current = true;
      setError(null);
      restartScheduledRef.current = false;

      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            onFinalRef.current(result[0].transcript);
          } else {
            interimText += result[0].transcript;
          }
        }
        setInterim(interimText);
      };

      rec.onerror = (event) => {
        if (FATAL_ERRORS.has(event.error)) {
          wantsListeningRef.current = false;
          setError(
            event.error === 'audio-capture'
              ? 'Microphone is busy — the video-call mic is using it. Mute the call mic or leave the video room, then try again.'
              : event.error === 'not-allowed'
                ? 'Microphone access was denied. Allow mic access in the browser, then try again.'
                : 'Speech recognition failed. Please try again.'
          );
          cleanup();
          return;
        }
        // Transient: no-speech, aborted — restart once if still wanted.
        if (wantsListeningRef.current && !restartScheduledRef.current) {
          restartScheduledRef.current = true;
          setTimeout(() => {
            restartScheduledRef.current = false;
            if (wantsListeningRef.current && recRef.current === rec) {
              try {
                rec.start();
              } catch {
                // ignore
              }
            }
          }, 250);
        }
      };

      rec.onend = () => {
        // Chrome drops sessions; restart unless the user stopped or a fatal error fired.
        if (wantsListeningRef.current && !restartScheduledRef.current) {
          restartScheduledRef.current = true;
          setTimeout(() => {
            restartScheduledRef.current = false;
            if (wantsListeningRef.current && recRef.current === rec) {
              try {
                rec.start();
              } catch {
                // ignore
              }
            }
          }, 250);
          return;
        }
        if (!wantsListeningRef.current) {
          cleanup();
        }
      };

      recRef.current = rec;
      onFinalRef.current = onFinal;
      setListening(true);
      try {
        rec.start();
      } catch {
        setError('Could not start speech recognition. Please try again.');
        cleanup();
      }
    },
    [supported, stop, cleanup]
  );

  useEffect(() => {
    return () => {
      wantsListeningRef.current = false;
      try {
        recRef.current?.abort();
        recRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
