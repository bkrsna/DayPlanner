'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Globe,
  Hourglass,
  Plus,
  Trash2,
  Bell,
  Clock as ClockIcon,
} from 'lucide-react';

interface CityConfig {
  id: string;
  name: string;
  tz: string;
}

interface LapRecord {
  lapNumber: number;
  splitMs: number;
  totalMs: number;
}

const AVAILABLE_WORLD_CITIES: CityConfig[] = [
  { id: 'local', name: 'Local Time', tz: 'local' },
  { id: 'nyc', name: 'New York (EDT)', tz: 'America/New_York' },
  { id: 'london', name: 'London (BST)', tz: 'Europe/London' },
  { id: 'paris', name: 'Paris (CEST)', tz: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin (CEST)', tz: 'Europe/Berlin' },
  { id: 'dubai', name: 'Dubai (GST)', tz: 'Asia/Dubai' },
  { id: 'delhi', name: 'New Delhi (IST)', tz: 'Asia/Kolkata' },
  { id: 'singapore', name: 'Singapore (SGT)', tz: 'Asia/Singapore' },
  { id: 'hongkong', name: 'Hong Kong (HKT)', tz: 'Asia/Hong_Kong' },
  { id: 'tokyo', name: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
  { id: 'sydney', name: 'Sydney (AEST)', tz: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland (NZST)', tz: 'Pacific/Auckland' },
  { id: 'sf', name: 'San Francisco (PDT)', tz: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago (CDT)', tz: 'America/Chicago' },
  { id: 'utc', name: 'UTC (Universal)', tz: 'UTC' },
];

const DEFAULT_CLOCK_CITIES: CityConfig[] = [
  { id: 'local', name: 'Local Time', tz: 'local' },
  { id: 'nyc', name: 'New York (EDT)', tz: 'America/New_York' },
  { id: 'london', name: 'London (BST)', tz: 'Europe/London' },
  { id: 'tokyo', name: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
];

const CLOCK_STORAGE_KEY = 'mac_app_clock_cities_v1';

// Helper to synthesize a friendly chime without external audio assets
let sharedAudioCtx: AudioContext | null = null;

function unlockAudioContext() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

function playCompletionChime() {
  try {
    unlockAudioContext();
    if (!sharedAudioCtx) return;
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Pleasant three-note chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    playTone(523.25, now, 0.4);
    playTone(659.25, now + 0.15, 0.4);
    playTone(783.99, now + 0.3, 0.6);
  } catch {
    // AudioContext blocked or not supported in environment
  }
}

export function MacClockApp() {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'world' | 'timer'>('stopwatch');
  const [now, setNow] = useState<Date>(new Date());

  // Clock ticker for world clock and display
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 1. Stopwatch State & Logic
  // -------------------------------------------------------------
  const [isSwRunning, setIsSwRunning] = useState(false);
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const swStartTimeRef = useRef<number>(0);
  const swAccumulatedMsRef = useRef<number>(0);
  const swLastLapTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSwRunning) {
      interval = setInterval(() => {
        if (swStartTimeRef.current) {
          const currentTotal = Date.now() - swStartTimeRef.current + swAccumulatedMsRef.current;
          setSwElapsedMs(currentTotal);
        }
      }, 25);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSwRunning]);

  const handleStartSw = () => {
    if (isSwRunning) return;
    swStartTimeRef.current = Date.now();
    setIsSwRunning(true);
  };

  const handlePauseSw = () => {
    if (!isSwRunning) return;
    swAccumulatedMsRef.current += Date.now() - swStartTimeRef.current;
    setSwElapsedMs(swAccumulatedMsRef.current);
    setIsSwRunning(false);
  };

  const handleResetSw = () => {
    swStartTimeRef.current = 0;
    swAccumulatedMsRef.current = 0;
    swLastLapTimeRef.current = 0;
    setSwElapsedMs(0);
    setIsSwRunning(false);
    setLaps([]);
  };

  const handleLapSw = () => {
    if (!isSwRunning) return;
    const currentTotal = Date.now() - swStartTimeRef.current + swAccumulatedMsRef.current;
    const split = currentTotal - swLastLapTimeRef.current;
    swLastLapTimeRef.current = currentTotal;

    const newLap: LapRecord = {
      lapNumber: laps.length + 1,
      splitMs: split,
      totalMs: currentTotal,
    };
    setLaps((prev) => [newLap, ...prev]);
  };

  const formatStopwatchTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  // Find min and max lap splits for highlighting (if at least 2 laps with differing times)
  let fastestLapIndex = -1;
  let slowestLapIndex = -1;
  if (laps.length >= 2) {
    let minSplit = Infinity;
    let maxSplit = -Infinity;
    laps.forEach((lap, idx) => {
      if (lap.splitMs < minSplit) {
        minSplit = lap.splitMs;
        fastestLapIndex = idx;
      }
      if (lap.splitMs > maxSplit) {
        maxSplit = lap.splitMs;
        slowestLapIndex = idx;
      }
    });
    // Only highlight if splits are not identical
    if (minSplit >= maxSplit) {
      fastestLapIndex = -1;
      slowestLapIndex = -1;
    }
  }

  // -------------------------------------------------------------
  // 2. World Clock State & Logic
  // -------------------------------------------------------------
  const [worldCities, setWorldCities] = useState<CityConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CLOCK_CITIES;
    try {
      const saved = localStorage.getItem(CLOCK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CLOCK_CITIES;
  });
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const saveWorldCities = (cities: CityConfig[]) => {
    setWorldCities(cities);
    try {
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(cities));
    } catch {
      // ignore
    }
  };

  const handleAddWorldCity = (city: CityConfig) => {
    if (worldCities.some((c) => c.id === city.id)) return;
    saveWorldCities([...worldCities, city]);
    setIsCityDropdownOpen(false);
  };

  const handleRemoveWorldCity = (id: string) => {
    saveWorldCities(worldCities.filter((c) => c.id !== id));
  };

  // Helper to compute hour difference relative to local with accurate day context
  const getOffsetString = (city: CityConfig) => {
    if (city.tz === 'local') return 'Local Time';
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localStr = now.toLocaleString('en-US', { timeZone: localTz });
      const targetStr = now.toLocaleString('en-US', { timeZone: city.tz });
      const localDate = new Date(localStr);
      const targetDate = new Date(targetStr);
      const diffHours = (targetDate.getTime() - localDate.getTime()) / (1000 * 60 * 60);

      const targetDay = targetDate.getDate();
      const localDay = localDate.getDate();
      let dayText = 'Today';
      if (targetDay !== localDay) {
        dayText = targetDate.getTime() > localDate.getTime() ? 'Tomorrow' : 'Yesterday';
      }

      if (Math.abs(diffHours) < 0.01) return 'Same as local';
      const sign = diffHours > 0 ? '+' : '-';
      const absDiff = Math.abs(diffHours);
      const hoursPart = Math.floor(absDiff);
      const minsPart = Math.round((absDiff - hoursPart) * 60);
      const formatted =
        minsPart === 0 ? `${hoursPart}` : `${hoursPart}:${minsPart.toString().padStart(2, '0')}`;
      return `${dayText}, ${sign}${formatted} HRS`;
    } catch {
      return '';
    }
  };

  // -------------------------------------------------------------
  // 3. Focus Timer State & Logic
  // -------------------------------------------------------------
  const [timerDurationSecs, setTimerDurationSecs] = useState<number>(25 * 60); // default 25 min Pomodoro
  const [timerRemainingSecs, setTimerRemainingSecs] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);

  const resetTimerTo = useCallback((secs: number) => {
    unlockAudioContext();
    setIsTimerRunning(false);
    setTimerDurationSecs(secs);
    setTimerRemainingSecs(secs);
    setTimerFinished(false);
  }, []);

  const nudgeTimer = (deltaSecs: number) => {
    unlockAudioContext();
    const next = Math.max(60, Math.min(180 * 60, timerDurationSecs + deltaSecs));
    resetTimerTo(next);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerRemainingSecs((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    unlockAudioContext();
    if (timerRemainingSecs <= 0) {
      setTimerRemainingSecs(timerDurationSecs);
    }
    setTimerFinished(false);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerRemainingSecs(timerDurationSecs);
    setTimerFinished(false);
  };

  const formatTimerClock = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timerProgressPercent =
    timerDurationSecs > 0 ? ((timerDurationSecs - timerRemainingSecs) / timerDurationSecs) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#f6f6f7] dark:bg-[#18181b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/20">
      {/* Sub-navigation bar inside Clock App */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'stopwatch'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Timer className="w-4 h-4 text-orange-500" />
            <span>Stopwatch</span>
            {isSwRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('world')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'world'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>World Clock</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {worldCities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'timer'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Hourglass className="w-4 h-4 text-emerald-500" />
            <span>Focus Timer</span>
            {isTimerRunning && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Live system clock readout in header */}
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>
            {now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ======================================================== */}
        {/* 1. STOPWATCH VIEW                                        */}
        {/* ======================================================== */}
        {activeTab === 'stopwatch' && (
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center space-y-8 py-4">
            {/* Massive Digital Timer Display */}
            <div className="relative flex flex-col items-center justify-center p-8 w-full rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2">
                High Precision Stopwatch
              </div>
              <div className="text-5xl sm:text-7xl font-light font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
                {formatStopwatchTime(swElapsedMs)}
              </div>

              {/* Status Pill */}
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isSwRunning
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : swElapsedMs > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSwRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                    }`}
                  />
                  {isSwRunning ? 'Running' : swElapsedMs > 0 ? 'Paused' : 'Ready'}
                </span>
                {laps.length > 0 && (
                  <span className="text-xs text-zinc-400 font-medium">
                    {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'} recorded
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Lap, Start/Pause, Reset */}
            <div className="flex items-center justify-center gap-4 w-full max-w-md">
              {/* Lap Button */}
              <button
                onClick={handleLapSw}
                disabled={!isSwRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
              >
                <Flag className="w-4 h-4" />
                <span>Lap</span>
              </button>

              {/* Primary Start / Pause Button */}
              {!isSwRunning ? (
                <button
                  onClick={handleStartSw}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseSw}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-md shadow-amber-500/20"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              {/* Reset Button */}
              <button
                onClick={handleResetSw}
                disabled={swElapsedMs === 0 && !isSwRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {/* Lap Records Table */}
            {laps.length > 0 && (
              <div className="w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Lap #</span>
                  <span>Split Time</span>
                  <div className="flex items-center gap-2">
                    <span>Overall Time</span>
                    <button
                      onClick={() => {
                        const text = laps
                          .slice()
                          .reverse()
                          .map(
                            (l) =>
                              `Lap ${l.lapNumber}: +${formatStopwatchTime(l.splitMs)} (Total: ${formatStopwatchTime(l.totalMs)})`
                          )
                          .join('\n');
                        navigator.clipboard?.writeText(text);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-sans normal-case underline"
                      title="Copy lap splits to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-sm">
                  {laps.map((lap, index) => {
                    const isFastest = index === fastestLapIndex;
                    const isSlowest = index === slowestLapIndex;

                    return (
                      <div
                        key={lap.lapNumber}
                        className={`px-5 py-2.5 flex items-center justify-between transition-colors ${
                          isFastest
                            ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                            : isSlowest
                            ? 'bg-rose-500/5 text-rose-600 dark:text-rose-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs">
                            Lap {lap.lapNumber}
                          </span>
                          {isFastest && (
                            <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-md bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400">
                              Fastest
                            </span>
                          )}
                          {isSlowest && (
                            <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-md bg-rose-500/15 font-semibold text-rose-600 dark:text-rose-400">
                              Slowest
                            </span>
                          )}
                        </div>
                        <span className="tabular-nums">
                          +{formatStopwatchTime(lap.splitMs)}
                        </span>
                        <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatStopwatchTime(lap.totalMs)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. WORLD CLOCK VIEW                                      */}
        {/* ======================================================== */}
        {activeTab === 'world' && (
          <div className="space-y-6">
            {/* Header / Add City Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Global Time Zones
                </h3>
                <p className="text-xs text-zinc-500">
                  Track team and partner hours across primary international hubs
                </p>
              </div>

              {/* Add City Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add City</span>
                </button>

                {isCityDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 p-2 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-3 py-1">
                      Select City
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {AVAILABLE_WORLD_CITIES.filter(
                        (c) => !worldCities.some((item) => item.id === c.id)
                      ).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleAddWorldCity(c)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {c.tz === 'local'
                              ? now.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : now.toLocaleTimeString('en-US', {
                                  timeZone: c.tz,
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* World Cities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {worldCities.map((city) => {
                let timeStr = '--:--';
                let dateStr = '';
                let hours = 0;
                let minutes = 0;
                let seconds = 0;

                try {
                  const options: Intl.DateTimeFormatOptions =
                    city.tz === 'local' ? {} : { timeZone: city.tz };
                  timeStr = now.toLocaleTimeString('en-US', {
                    ...options,
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });
                  dateStr = now.toLocaleDateString('en-US', {
                    ...options,
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });

                  // Extract hours & minutes for analog clock face
                  const parts = new Intl.DateTimeFormat('en-US', {
                    ...options,
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: false,
                  }).formatToParts(now);

                  parts.forEach((p) => {
                    if (p.type === 'hour') hours = parseInt(p.value, 10);
                    if (p.type === 'minute') minutes = parseInt(p.value, 10);
                    if (p.type === 'second') seconds = parseInt(p.value, 10);
                  });
                } catch {
                  timeStr = '--:--';
                }

                // Degrees for analog hands
                const hourAngle = ((hours % 12) + minutes / 60) * 30;
                const minAngle = (minutes + seconds / 60) * 6;
                const secAngle = seconds * 6;

                return (
                  <div
                    key={city.id}
                    className="group relative flex flex-col items-center justify-between p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-center"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveWorldCity(city.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title={`Remove ${city.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Analog Clock Face */}
                    <div className="relative w-28 h-28 my-2 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Dial Circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          className="fill-zinc-50 dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700"
                          strokeWidth="2"
                        />
                        {/* Hour ticks */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                          (deg) => (
                            <line
                              key={deg}
                              x1="50"
                              y1="8"
                              x2="50"
                              y2="13"
                              stroke="currentColor"
                              strokeWidth={deg % 90 === 0 ? '2' : '1'}
                              className="text-zinc-300 dark:text-zinc-600"
                              transform={`rotate(${deg} 50 50)`}
                            />
                          )
                        )}
                        {/* Hour Hand */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="24"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="text-zinc-900 dark:text-zinc-100"
                          transform={`rotate(${hourAngle} 50 50)`}
                        />
                        {/* Minute Hand */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="16"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="text-zinc-700 dark:text-zinc-300"
                          transform={`rotate(${minAngle} 50 50)`}
                        />
                        {/* Second Hand (Orange) */}
                        <line
                          x1="50"
                          y1="56"
                          x2="50"
                          y2="14"
                          stroke="#f97316"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          transform={`rotate(${secAngle} 50 50)`}
                        />
                        {/* Center Pin */}
                        <circle cx="50" cy="50" r="3" fill="#f97316" />
                      </svg>
                    </div>

                    {/* Details */}
                    <div className="w-full space-y-1 mt-1">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {city.name}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400">
                        {getOffsetString(city)}
                      </div>
                      <div className="font-mono text-xl font-medium text-zinc-900 dark:text-zinc-50 pt-1 tabular-nums">
                        {timeStr}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {dateStr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. FOCUS TIMER VIEW                                      */}
        {/* ======================================================== */}
        {activeTab === 'timer' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center space-y-8 py-6">
            {/* Circular Progress Ring with Timer Countdown */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-zinc-200 dark:stroke-zinc-800 fill-none"
                  strokeWidth="5"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="url(#timerGradient)"
                  strokeWidth="5"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 * (1 - timerProgressPercent / 100)}
                  strokeLinecap="round"
                  className="fill-none transition-all duration-300"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inner Countdown Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                  Focus Countdown
                </div>
                <div className="text-4xl sm:text-5xl font-light font-mono text-zinc-900 dark:text-zinc-50 tracking-tight tabular-nums">
                  {formatTimerClock(timerRemainingSecs)}
                </div>
                {timerFinished ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-bounce">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Time Completed!</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-zinc-400 font-mono">
                    {Math.round(100 - timerProgressPercent)}% remaining
                  </div>
                )}
              </div>
            </div>

            {/* Presets Bar & Adjustments */}
            <div className="space-y-2 w-full flex flex-col items-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: '5m Quick', secs: 5 * 60 },
                  { label: '15m Break', secs: 15 * 60 },
                  { label: '25m Pomodoro', secs: 25 * 60 },
                  { label: '45m Deep Work', secs: 45 * 60 },
                  { label: '60m Power', secs: 60 * 60 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => resetTimerTo(preset.secs)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      timerDurationSecs === preset.secs
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                <span className="text-[11px]">Fine-tune:</span>
                <button
                  onClick={() => nudgeTimer(-5 * 60)}
                  className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  title="Subtract 5 minutes"
                >
                  -5m
                </button>
                <button
                  onClick={() => nudgeTimer(-1 * 60)}
                  className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  title="Subtract 1 minute"
                >
                  -1m
                </button>
                <button
                  onClick={() => nudgeTimer(1 * 60)}
                  className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  title="Add 1 minute"
                >
                  +1m
                </button>
                <button
                  onClick={() => nudgeTimer(5 * 60)}
                  className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  title="Add 5 minutes"
                >
                  +5m
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 w-full max-w-xs">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartTimer}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-md"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timerRemainingSecs === timerDurationSecs ? 'Start' : 'Resume'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTimer}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-md shadow-amber-500/20"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleResetTimer}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors shadow-xs"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
