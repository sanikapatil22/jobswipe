'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Loader2,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  Video,
} from 'lucide-react';
import { AIInterviewerTile } from './AIInterviewerTile';

interface LiveKitCallProps {
  applicationId: string;
  participantName: string;
  onConnectedChange?: (connected: boolean) => void;
  /** When true (user is dictating an answer), the call mic auto-mutes so the
   *  browser speech recognizer can capture the microphone. */
  transcriptionActive?: boolean;
  /** Interviewer TTS is speaking — the AI tile animates its waveform. */
  interviewerSpeaking?: boolean;
  /** Current question shown on the AI interviewer tile. */
  interviewerQuestion?: string;
  companyName?: string;
}

/**
 * LiveKit-powered video call panel for the AI Mock Interview Simulator.
 * The user joins a private, invite-only room (random name, max 2
 * participants); the AI interviewer is simulated — a live animated tile
 * (avatar + TTS-synced waveform + current question) instead of a black
 * remote-video panel. Degrades gracefully when LiveKit env vars are missing.
 */
export const LiveKitCall: React.FC<LiveKitCallProps> = ({
  applicationId,
  participantName,
  onConnectedChange,
  transcriptionActive = false,
  interviewerSpeaking = false,
  interviewerQuestion,
  companyName = 'AI',
}) => {
  const [probe, setProbe] = useState<'loading' | 'configured' | 'missing'>('loading');
  const [probeError, setProbeError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState('');
  const [roomName, setRoomName] = useState('');

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const micAutoMutedRef = useRef(false);

  // Probe whether LiveKit is configured.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.configured) {
          setProbe('configured');
        } else {
          setProbe('missing');
          setProbeError(data.error || 'LiveKit is not configured.');
        }
      } catch {
        if (cancelled) return;
        setProbe('missing');
        setProbeError('Could not reach the LiveKit token service.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const join = useCallback(async () => {
    if (!roomRef.current) {
      roomRef.current = new Room({ adaptiveStream: true, dynacast: true });
    }
    const room = roomRef.current;
    setConnecting(true);
    setError('');
    try {
      // Private room: unique, unguessable name per session.
      const name = `interview-${applicationId}-${Math.random().toString(36).slice(2, 10)}`;
      setRoomName(name);

      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: name,
          identity: `${participantName}-${Math.random().toString(36).slice(2, 8)}`,
        }),
      });
      const data = await res.json();
      if (!data.configured || !data.url || !data.token) {
        throw new Error(data.error || 'LiveKit is not configured.');
      }

      await room.connect(data.url, data.token);
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      room.on(RoomEvent.LocalTrackPublished, (pub) => {
        if (pub.track && pub.kind === 'video') {
          const el = localVideoRef.current;
          if (el) pub.track.attach(el);
        }
      });

      // Attach local camera feed.
      room.localParticipant.trackPublications.forEach((pub) => {
        if (pub.track && pub.kind === 'video') {
          const el = localVideoRef.current;
          if (el) pub.track.attach(el);
        }
      });

      setConnected(true);
      onConnectedChange?.(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the video call.');
    } finally {
      setConnecting(false);
    }
  }, [applicationId, participantName, onConnectedChange]);

  const leave = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      room.disconnect();
      room.removeAllListeners();
    }
    setConnected(false);
    setCameraOn(true);
    setMicOn(true);
    setRoomName('');
    onConnectedChange?.(false);
  }, [onConnectedChange]);

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    const next = !cameraOn;
    await roomRef.current.localParticipant.setCameraEnabled(next);
    setCameraOn(next);
  }, [cameraOn]);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const next = !micOn;
    await roomRef.current.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [micOn]);

  // Release the microphone for speech-to-text while the user is dictating,
  // then restore it afterwards.
  useEffect(() => {
    const room = roomRef.current;
    if (!room || !connected) return;
    if (transcriptionActive) {
      if (micOn) {
        micAutoMutedRef.current = true;
        void room.localParticipant.setMicrophoneEnabled(false);
        setMicOn(false);
      }
    } else if (micAutoMutedRef.current) {
      micAutoMutedRef.current = false;
      void room.localParticipant.setMicrophoneEnabled(true);
      setMicOn(true);
    }
  }, [transcriptionActive, connected, micOn]);

  // Re-attach local video whenever the call connects (publications can land late).
  useEffect(() => {
    if (!connected || !roomRef.current) return;
    const attachLocal = () => {
      const el = localVideoRef.current;
      const room = roomRef.current;
      if (!el || !room) return;
      room.localParticipant.trackPublications.forEach((pub) => {
        if (pub.track && pub.kind === 'video') pub.track.attach(el);
      });
    };
    attachLocal();
    const timer = window.setTimeout(attachLocal, 800);
    return () => window.clearTimeout(timer);
  }, [connected]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current?.removeAllListeners();
    };
  }, []);

  if (probe === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking video conference setup…
      </div>
    );
  }

  if (probe === 'missing') {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />
        <div>
          <p className="font-black mb-0.5">LiveKit video is not configured</p>
          <p className="leading-relaxed">
            {probeError} Once set, the video interview room will appear here. The
            chat + voice interviewer below still works without it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-900 overflow-hidden">
      {!connected ? (
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 mb-3">
            <Video className="w-6 h-6" />
          </div>
          <h4 className="text-white font-black text-sm mb-1">Video Interview Room</h4>
          <p className="text-slate-400 text-xs font-semibold mb-4 max-w-sm">
            Turn on your camera and mic for a realistic interview setup. The
            {` `}interviewer reads your answers and speaks back via the chat.
          </p>
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mb-4">
            <Lock className="w-3 h-3" />
            Private room — only you can join; nobody else has access.
          </p>
          {error && (
            <p className="text-rose-400 text-xs font-bold mb-3 max-w-sm">{error}</p>
          )}
          <button
            onClick={() => void join()}
            disabled={connecting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-colors disabled:opacity-50"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            <span>{connecting ? 'Joining room…' : 'Start Video Interview'}</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
              <Lock className="w-3 h-3" />
              Private room · {roomName}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              1 participant · you + AI interviewer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video">
              <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-black">
                You
              </span>
              {!cameraOn && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <CameraOff className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>
            <AIInterviewerTile
              companyName={companyName}
              speaking={interviewerSpeaking}
              listening={transcriptionActive}
              question={interviewerQuestion}
            />
          </div>

          <div className="flex items-center justify-center gap-2 p-3">
            <button
              onClick={() => void toggleCamera()}
              title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={`p-2.5 rounded-full transition-colors ${
                cameraOn
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-rose-600 text-white hover:bg-rose-500'
              }`}
            >
              {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => void toggleMic()}
              title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              className={`p-2.5 rounded-full transition-colors ${
                micOn
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-rose-600 text-white hover:bg-rose-500'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => void leave()}
              title="Leave the interview room"
              className="p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
