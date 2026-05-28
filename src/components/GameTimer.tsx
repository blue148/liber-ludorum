import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGameTimer, saveGameTimer, GameTimerState } from '../lib/gameTimer';
import { Clock, Play, Square } from 'lucide-react';

const MAX_DURATION_MS = 48 * 60 * 60 * 1000;

const EMPTY_TIMER: GameTimerState = {
  started_at: null,
  stopped_at: null,
  is_running: false,
};

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function GameTimer() {
  const { user } = useAuth();
  const [timer, setTimer] = useState<GameTimerState>(EMPTY_TIMER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const autoStopRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTimer() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const stored = await getGameTimer(user.id);
        const normalized = normalizeTimerState(stored);
        if (isMounted) {
          setTimer(normalized.state);
        }
        if (normalized.needsSave) {
          await saveGameTimer(user.id, normalized.state);
          if (isMounted) {
            setNotice('Timer auto-stopped after 48 hours.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load timer');
        }
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTimer();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!timer.is_running) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer.is_running]);

  useEffect(() => {
    if (!user || !timer.is_running || !timer.started_at) return;
    const startMs = Date.parse(timer.started_at);
    if (Number.isNaN(startMs)) return;
    const elapsed = now - startMs;
    if (elapsed >= MAX_DURATION_MS && !autoStopRef.current) {
      autoStopRef.current = true;
      void handleAutoStop(timer.started_at);
    }
  }, [now, timer, user]);

  async function handleStart() {
    if (!user) return;
    const newState: GameTimerState = {
      started_at: new Date().toISOString(),
      stopped_at: null,
      is_running: true,
    };

    setError(null);
    setNotice(null);
    autoStopRef.current = false;
    setTimer(newState);

    try {
      await saveGameTimer(user.id, newState);
    } catch (err) {
      setError('Failed to start timer');
      console.error(err);
    }
  }

  async function handleStop() {
    if (!user || !timer.started_at) return;
    const previous = timer;
    const newState: GameTimerState = {
      started_at: timer.started_at,
      stopped_at: new Date().toISOString(),
      is_running: false,
    };

    setError(null);
    setNotice(null);
    setTimer(newState);

    try {
      await saveGameTimer(user.id, newState);
    } catch (err) {
      setTimer(previous);
      setError('Failed to stop timer');
      console.error(err);
    }
  }

  async function handleAutoStop(startedAt: string) {
    if (!user) return;
    const stopMs = Date.parse(startedAt) + MAX_DURATION_MS;
    const newState: GameTimerState = {
      started_at: startedAt,
      stopped_at: new Date(stopMs).toISOString(),
      is_running: false,
    };

    setTimer(newState);
    setNotice('Timer auto-stopped after 48 hours.');

    try {
      await saveGameTimer(user.id, newState);
    } catch (err) {
      setError('Failed to auto-stop timer');
      console.error(err);
    }
  }

  function normalizeTimerState(stored: GameTimerState | null): {
    state: GameTimerState;
    needsSave: boolean;
  } {
    if (!stored) {
      return { state: EMPTY_TIMER, needsSave: false };
    }

    if (stored.is_running && stored.started_at) {
      const startMs = Date.parse(stored.started_at);
      if (!Number.isNaN(startMs)) {
        const elapsed = Date.now() - startMs;
        if (elapsed >= MAX_DURATION_MS) {
          const stopMs = startMs + MAX_DURATION_MS;
          return {
            state: {
              started_at: stored.started_at,
              stopped_at: new Date(stopMs).toISOString(),
              is_running: false,
            },
            needsSave: true,
          };
        }
      }
    }

    return { state: stored, needsSave: false };
  }

  const durationMs = useMemo(() => {
    if (!timer.started_at) return 0;
    const startMs = Date.parse(timer.started_at);
    if (Number.isNaN(startMs)) return 0;

    if (timer.is_running) {
      return Math.min(Math.max(now - startMs, 0), MAX_DURATION_MS);
    }

    const stopMs = timer.stopped_at ? Date.parse(timer.stopped_at) : startMs;
    if (Number.isNaN(stopMs)) return 0;
    return Math.min(Math.max(stopMs - startMs, 0), MAX_DURATION_MS);
  }, [timer, now]);

  const durationText = formatDuration(durationMs);
  const progressPercent = Math.min((durationMs / MAX_DURATION_MS) * 100, 100);
  const hasHistory = Boolean(timer.started_at);
  const statusText = timer.is_running ? 'In Progress' : hasHistory ? 'Stopped' : 'Not Started';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="hidden md:flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-purple-600" />
        <div>
          <h2 className="text-3xl font-display font-light text-slate-900">Game Timer</h2>
          <p className="text-slate-600 mt-1">Track the current game session in your account.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-container p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm text-slate-600">Status</p>
            <p className="text-xl font-semibold text-slate-900">{statusText}</p>
            <div className="mt-4">
              <p className="text-5xl font-bold text-slate-900 tracking-tight">{durationText}</p>
              <p className="text-xs text-slate-500 mt-2">HH:MM elapsed</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStart}
              disabled={timer.is_running || !user}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Game
            </button>
            <button
              onClick={handleStop}
              disabled={!timer.is_running || !user}
              className="px-5 py-3 bg-white border border-container text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Game
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
            <span>48:00 max</span>
          </div>
        </div>

        <div className="mt-6 border-t border-container pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700">Started</p>
            <p>{formatDateTime(timer.started_at)}</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">Stopped</p>
            <p>{formatDateTime(timer.stopped_at)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 border border-container rounded-lg p-4 text-sm text-slate-600">
        The timer uses your account start time and runs until you stop it or 48 hours pass.
      </div>
    </div>
  );
}
