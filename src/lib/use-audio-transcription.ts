'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioTranscriptionState = 'idle' | 'recording' | 'transcribing' | 'error';

function pickMimeType(): string | undefined {
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];
  if (typeof MediaRecorder === 'undefined') return undefined;
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string | null;
      if (!result) return reject(new Error('Could not read audio'));
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('Could not read audio'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Record-with-the-mic fallback for voice answers. Uses MediaRecorder to
 * capture audio, then sends it to /api/ai/transcribe (Gemini) for
 * speech-to-text. Used when the browser's Web Speech API is unavailable or
 * fails — Chrome deprecated it for most users.
 */
export function useAudioTranscription() {
  const supported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const [state, setState] = useState<AudioTranscriptionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    if (!supported) {
      setError('Recording is not supported in this browser.');
      setState('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());
      recorder.start();
      recorderRef.current = recorder;
      setError(null);
      setState('recording');
    } catch {
      setError('Could not access the microphone. Allow mic access in the browser and try again.');
      setState('error');
    }
  }, [supported]);

  const stop = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder || recorder.state === 'inactive') return '';
    setState('transcribing');
    try {
      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
        };
        recorder.stop();
      });
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType: blob.type }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Transcription failed');
      }
      setState('idle');
      return String(data.text).trim();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed. Please try again.');
      setState('error');
      return '';
    }
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    setState('idle');
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
    };
  }, []);

  return { supported, state, error, start, stop, cancel };
}
