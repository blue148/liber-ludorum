import { useEffect, useMemo, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';

const STEP_SECONDS = 10;
const MIN_SECONDS = 10;
const MAX_SECONDS = 60 * 60;

const PRESET_SECONDS = [30, 60, 90, 120, 180, 300];

type ToneOptions = {
  frequency: number;
  durationMs: number;
  volume: number;
  type: OscillatorType;
};

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function TurnTimer() {
  const [durationSec, setDurationSec] = useState(60);
  const [timeLeftSec, setTimeLeftSec] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const lastBeepRef = useRef<number | null>(null);
  const alarmedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeftSec(durationSec);
    }
  }, [durationSec, isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (endAtRef.current === null) return;
      const remainingMs = Math.max(endAtRef.current - Date.now(), 0);
      const nextSeconds = Math.ceil(remainingMs / 1000);
      setTimeLeftSec(prev => (prev === nextSeconds ? prev : nextSeconds));

      if (remainingMs <= 0) {
        handleComplete();
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeftSec <= 5 && timeLeftSec > 0 && lastBeepRef.current !== timeLeftSec) {
      playWarningBeep();
      lastBeepRef.current = timeLeftSec;
    }
    if (timeLeftSec === 0) {
      lastBeepRef.current = null;
    }
  }, [timeLeftSec, isRunning]);

  function initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextCtor();
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function scheduleTone(ctx: AudioContext, options: ToneOptions, startTime = ctx.currentTime) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.frequency, startTime);
    gain.gain.setValueAtTime(options.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + options.durationMs / 1000);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + options.durationMs / 1000);
  }

  function playWarningBeep() {
    const ctx = initAudioContext();
    if (!ctx) return;
    scheduleTone(ctx, {
      frequency: 880,
      durationMs: 90,
      volume: 0.25,
      type: 'sine',
    });
  }

  function playAlarm() {
    const ctx = initAudioContext();
    if (!ctx) return;
    const start = ctx.currentTime;
    const pulseDuration = 220;
    const gap = 80;

    for (let i = 0; i < 3; i += 1) {
      const pulseStart = start + (pulseDuration + gap) * (i / 1000);
      scheduleTone(
        ctx,
        {
          frequency: 220,
          durationMs: pulseDuration,
          volume: 0.6,
          type: 'square',
        },
        pulseStart,
      );
    }
  }

  function adjustDuration(delta: number) {
    if (isRunning) return;
    setDurationSec(prev => clamp(prev + delta, MIN_SECONDS, MAX_SECONDS));
  }

  function setPreset(seconds: number) {
    if (isRunning) return;
    setDurationSec(clamp(seconds, MIN_SECONDS, MAX_SECONDS));
  }

  function handleStart() {
    const startSeconds = timeLeftSec === 0 ? durationSec : timeLeftSec;
    initAudioContext();
    alarmedRef.current = false;
    lastBeepRef.current = null;
    endAtRef.current = Date.now() + startSeconds * 1000;
    setTimeLeftSec(startSeconds);
    setIsRunning(true);
  }

  function handlePause() {
    if (!isRunning || endAtRef.current === null) return;
    const remainingMs = Math.max(endAtRef.current - Date.now(), 0);
    setTimeLeftSec(Math.ceil(remainingMs / 1000));
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    endAtRef.current = null;
    alarmedRef.current = false;
    lastBeepRef.current = null;
    setTimeLeftSec(durationSec);
  }

  function handleComplete() {
    if (alarmedRef.current) return;
    alarmedRef.current = true;
    setIsRunning(false);
    endAtRef.current = null;
    setTimeLeftSec(0);
    playAlarm();
  }

  const progressPercent = useMemo(() => {
    if (durationSec === 0) return 0;
    const elapsed = durationSec - timeLeftSec;
    return Math.min(Math.max((elapsed / durationSec) * 100, 0), 100);
  }, [durationSec, timeLeftSec]);

  const statusText = isRunning
    ? 'Running'
    : timeLeftSec === 0
    ? "Time's Up"
    : timeLeftSec < durationSec
    ? 'Paused'
    : 'Ready';

  const timeTextClass =
    isRunning && timeLeftSec > 0 && timeLeftSec <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-900';

  const canStart = !isRunning && durationSec > 0;
  const canPause = isRunning;
  const canReset = !isRunning && timeLeftSec !== durationSec;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="hidden md:flex items-center gap-3 mb-6">
        <Timer className="w-8 h-8 text-purple-600" />
        <div>
          <h2 className="text-3xl font-display font-light text-slate-900">Turn Timer</h2>
          <p className="text-slate-600 mt-1">Countdown each player turn in 10-second steps.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-container p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm text-slate-600">Status</p>
            <p className="text-xl font-semibold text-slate-900">{statusText}</p>
            <div className="mt-4">
              <p className={`text-6xl font-bold tracking-tight ${timeTextClass}`}>{formatSeconds(timeLeftSec)}</p>
              <p className="text-xs text-slate-500 mt-2">MM:SS remaining</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {timeLeftSec === 0 ? 'Restart' : 'Start'}
            </button>
            <button
              onClick={handlePause}
              disabled={!canPause}
              className="px-5 py-3 bg-white border border-container text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={handleReset}
              disabled={!canReset}
              className="px-5 py-3 bg-white border border-container text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>0:00</span>
            <span>{formatSeconds(durationSec)}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-container pt-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">Turn length</p>
              <p className="text-2xl font-semibold text-slate-900">{formatSeconds(durationSec)}</p>
              <p className="text-xs text-slate-500 mt-1">10-second steps, max 60 minutes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => adjustDuration(-STEP_SECONDS)}
                disabled={isRunning || durationSec <= MIN_SECONDS}
                className="px-3 py-2 border border-container rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Minus className="w-4 h-4" />
                10s
              </button>
              <button
                onClick={() => adjustDuration(STEP_SECONDS)}
                disabled={isRunning || durationSec >= MAX_SECONDS}
                className="px-3 py-2 border border-container rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                10s
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESET_SECONDS.map((seconds) => (
              <button
                key={seconds}
                onClick={() => setPreset(seconds)}
                disabled={isRunning}
                className="px-3 py-2 text-xs font-medium border border-container rounded-full text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formatSeconds(seconds)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        A warning beep sounds for the last 5 seconds, followed by a loud alarm at 0:00.
      </div>
    </div>
  );
}
