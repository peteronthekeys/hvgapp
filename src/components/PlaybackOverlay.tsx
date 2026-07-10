/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ProjectSchema } from '../types';
import { PreviewPanel, PreviewPlaybackHandle } from './PreviewPanel';

/** Chromium-only tab-capture constraints, extending the standard MediaStreamConstraints. */
interface TabCaptureConstraints extends MediaStreamConstraints {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
}

type PlaybackState = 'idle' | 'countdown' | 'playing' | 'recording' | 'done' | 'error';

const MIME_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_CANDIDATES.find(mime => MediaRecorder.isTypeSupported(mime)) ?? null;
}

function defaultDurationSec(schema: ProjectSchema): number {
  const totalVh = schema.scenes.reduce((sum, scene) => sum + scene.height, 0);
  return Math.max(4, Math.round((totalVh / 100) * 2));
}

interface PlaybackOverlayProps {
  schema: ProjectSchema;
  fps: number;
  onClose: () => void;
}

export function PlaybackOverlay({ schema, fps, onClose }: PlaybackOverlayProps) {
  const overlayRef = useRef<PreviewPlaybackHandle | null>(null);
  const [state, setState] = useState<PlaybackState>('idle');
  const [statusText, setStatusText] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scrollReady, setScrollReady] = useState(false);
  const [duration, setDuration] = useState(() => defaultDurationSec(schema));

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<PlaybackState>('idle');
  stateRef.current = state;

  // Poll for the scroll container to settle (max 5s) before enabling controls.
  useEffect(() => {
    let cancelled = false;
    let elapsedMs = 0;
    const POLL_MS = 200;
    const MAX_MS = 5000;

    const poll = () => {
      if (cancelled) return;
      const limit = overlayRef.current?.getScrollLimitPx() ?? 0;
      if (limit > 0) {
        setScrollReady(true);
        return;
      }
      elapsedMs += POLL_MS;
      if (elapsedMs >= MAX_MS) return;
      setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanupCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanupCapture, [cleanupCapture]);

  const handlePlayPreview = useCallback(async () => {
    if (!scrollReady) return;
    setState('playing');
    setStatusText(null);
    overlayRef.current?.seek(0);
    await new Promise(resolve => setTimeout(resolve, 100));
    await overlayRef.current?.play(duration);
    setState('idle');
  }, [duration, scrollReady]);

  const finalizeRecording = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    chunksRef.current = [];
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation-studio-export.webm';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    cleanupCapture();
    setState('done');
    setStatusText('Clip saved — animation-studio-export.webm is in your downloads.');
  }, [cleanupCapture]);

  const abortRecording = useCallback(() => {
    const recorder = recorderRef.current;
    overlayRef.current?.stop();
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      cleanupCapture();
      setState('idle');
    }
  }, [cleanupCapture]);

  const handleRecordClip = useCallback(async () => {
    if (!scrollReady) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatusText('Video export needs Chrome or Edge. Playback preview works everywhere.');
      return;
    }
    const mimeType = pickMimeType();
    if (!mimeType) {
      setStatusText('Video export needs Chrome or Edge. Playback preview works everywhere.');
      return;
    }

    setStatusText('Chrome will ask what to share — choose This Tab. Keep your cursor parked.');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: fps },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'exclude',
      } as TabCaptureConstraints);
    } catch {
      // Picker-cancel (NotAllowedError) — back to idle silently.
      setStatusText(null);
      setState('idle');
      return;
    }

    streamRef.current = stream;
    const [track] = stream.getVideoTracks();
    if (track && track.getSettings().displaySurface !== 'browser') {
      setStatusText('Heads up: you did not pick "This Tab" — the recording may include other windows.');
    } else {
      setStatusText(null);
    }

    track?.addEventListener('ended', () => {
      if (stateRef.current === 'recording') {
        abortRecording();
      }
    });

    overlayRef.current?.seek(0);
    setState('countdown');
    for (let n = 3; n >= 1; n -= 1) {
      setCountdown(n);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    // Esc (or the track ending) during the countdown aborts the capture and
    // returns to idle — don't resume recording on a dead stream.
    if (stateRef.current !== 'countdown') return;

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = finalizeRecording;

    recorder.start();
    setState('recording');
    await overlayRef.current?.play(duration);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (recorder.state !== 'inactive') recorder.stop();
  }, [abortRecording, duration, finalizeRecording, fps, scrollReady]);

  const handleClose = useCallback(() => {
    cleanupCapture();
    onClose();
  }, [cleanupCapture, onClose]);

  // Esc key: behavior depends on current state. StrictMode-safe cleanup.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const current = stateRef.current;
      if (current === 'idle' || current === 'done') {
        handleClose();
      } else if (current === 'playing') {
        overlayRef.current?.stop();
        setState('idle');
      } else if (current === 'recording' || current === 'countdown') {
        abortRecording();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [abortRecording, handleClose]);

  const controlsHidden = state === 'playing' || state === 'recording' || state === 'countdown';
  const canRecord = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      <PreviewPanel schema={schema} embedded playbackRef={overlayRef} />

      {state === 'recording' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">Recording</span>
        </div>
      )}

      {state === 'countdown' && countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-9xl font-bold text-white drop-shadow-lg">{countdown}</span>
        </div>
      )}

      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity ${
          controlsHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {statusText && (
          <div className="max-w-md text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5">
            {statusText}
          </div>
        )}

        {state === 'done' ? (
          <div className="flex items-center gap-3 rounded-full bg-slate-900/90 border border-slate-700 px-4 py-2.5">
            <span className="text-xs text-emerald-400">Clip saved.</span>
            <button
              onClick={() => {
                setState('idle');
                setStatusText(null);
              }}
              className="text-xs font-medium text-slate-300 hover:text-teal-400 transition-colors px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700"
            >
              Record again
            </button>
            <button
              onClick={handleClose}
              className="text-xs font-medium text-slate-300 hover:text-teal-400 transition-colors px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700"
            >
              Exit
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-full bg-slate-900/90 border border-slate-700 px-4 py-2.5">
            <button
              onClick={handlePlayPreview}
              disabled={!scrollReady}
              className="text-xs font-medium text-slate-100 hover:text-teal-400 transition-colors px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Play preview
            </button>

            <button
              onClick={handleRecordClip}
              disabled={!scrollReady || !canRecord}
              title={canRecord ? undefined : 'Video export needs Chrome or Edge'}
              className="text-xs font-medium text-slate-100 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Record clip
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <label htmlFor="playback-duration">Duration</label>
              <input
                id="playback-duration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={e => {
                  const parsed = parseInt(e.target.value, 10);
                  setDuration(Number.isNaN(parsed) ? duration : Math.min(120, Math.max(1, parsed)));
                }}
                className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-right focus:outline-none focus:border-teal-500"
              />
              <span>s</span>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            <button
              onClick={handleClose}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700"
              title="Exit (Esc)"
            >
              <X size={12} />
              Exit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
