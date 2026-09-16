'use client';

import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, X, Globe, Maximize2 } from 'lucide-react';

interface CityConfig {
  id: string; // unique key or IANA timezone
  name: string;
  tz: string; // IANA timezone or 'local'
}

interface ClockProps {
  onExpand?: () => void;
}

const AVAILABLE_CITIES: CityConfig[] = [
  { id: 'local', name: 'Local Time', tz: 'local' },
  { id: 'nyc', name: 'New York', tz: 'America/New_York' },
  { id: 'london', name: 'London', tz: 'Europe/London' },
  { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'sf', name: 'San Francisco', tz: 'America/Los_Angeles' },
  { id: 'paris', name: 'Paris', tz: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', tz: 'Europe/Berlin' },
  { id: 'dubai', name: 'Dubai', tz: 'Asia/Dubai' },
  { id: 'delhi', name: 'New Delhi', tz: 'Asia/Kolkata' },
  { id: 'singapore', name: 'Singapore', tz: 'Asia/Singapore' },
  { id: 'sydney', name: 'Sydney', tz: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', tz: 'Pacific/Auckland' },
  { id: 'chicago', name: 'Chicago', tz: 'America/Chicago' },
  { id: 'hongkong', name: 'Hong Kong', tz: 'Asia/Hong_Kong' },
  { id: 'utc', name: 'UTC', tz: 'UTC' },
];

const DEFAULT_SELECTED_CITIES: CityConfig[] = [
  { id: 'local', name: 'Local Time', tz: 'local' },
  { id: 'nyc', name: 'New York', tz: 'America/New_York' },
  { id: 'london', name: 'London', tz: 'Europe/London' },
  { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
];

const STORAGE_KEY = 'daytrack_selected_cities_v2';

export function Clock({ onExpand }: ClockProps = {}) {
  const [now, setNow] = useState<Date | null>(null);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // --- Stopwatch State ---
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  // 1. Clock Ticker
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load Selected Cities from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCities(parsed);
          return;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    setCities(DEFAULT_SELECTED_CITIES);
  }, []);

  // 3. Save Selected Cities
  const saveCities = (updated: CityConfig[]) => {
    setCities(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore quota errors
    }
  };

  const handleAddCity = (city: CityConfig) => {
    if (cities.some((c) => c.id === city.id)) return;
    saveCities([...cities, city]);
    setIsAddOpen(false);
  };

  const handleRemoveCity = (id: string) => {
    saveCities(cities.filter((c) => c.id !== id));
  };

  // Close Add Popover on Outside Click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsAddOpen(false);
      }
    }
    if (isAddOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddOpen]);

  // --- Stopwatch Engine ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current + accumulatedMsRef.current);
        }
      }, 33);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStart = () => {
    if (isRunning) return;
    startTimeRef.current = Date.now();
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isRunning) return;
    accumulatedMsRef.current += Date.now() - startTimeRef.current;
    setElapsedMs(accumulatedMsRef.current);
    setIsRunning(false);
  };

  const handleReset = () => {
    startTimeRef.current = 0;
    accumulatedMsRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
  };

  if (!now) {
    return (
      <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm min-h-[220px] flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
      </div>
    );
  }

  // Format Stopwatch Time: MM:SS.cc
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((elapsedMs % 1000) / 10);

  const formattedStopwatch = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const availableCities = AVAILABLE_CITIES.filter(
    (c) => !cities.some((item) => item.id === c.id)
  );

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. Stopwatch Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Stopwatch
            </span>
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Open full MacBook Clock & Stopwatch app"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-2xs"
                title="Start Stopwatch"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors shadow-2xs"
                title="Pause Stopwatch"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleReset}
              disabled={elapsedMs === 0 && !isRunning}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Stopwatch Display */}
        <div className="text-3xl sm:text-4xl font-light font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
          {formattedStopwatch}
        </div>
      </div>

      {/* 2. World Cities Section */}
      <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              World Cities
            </span>
          </div>

          {/* Add City Dropdown */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsAddOpen((prev) => !prev)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs"
              title="Select a city to add"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add City</span>
            </button>

            {isAddOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl bg-white dark:bg-zinc-900 p-1.5 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-52 overflow-y-auto space-y-0.5 py-1">
                  {availableCities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAddCity(c)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-normal">{c.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {c.tz === 'local'
                          ? now.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : now.toLocaleTimeString('en-US', {
                              timeZone: c.tz,
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                      </span>
                    </button>
                  ))}
                  {availableCities.length === 0 && (
                    <div className="text-center py-2.5 text-xs text-zinc-400">
                      All cities selected
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Cities - Every City has the EXACT SAME clean design */}
        <div className="space-y-1.5">
          {cities.map((city) => {
            let timeStr = '';
            let dateStr = '';

            try {
              if (city.tz === 'local') {
                timeStr = now.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                dateStr = now.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              } else {
                timeStr = now.toLocaleTimeString('en-US', {
                  timeZone: city.tz,
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                dateStr = now.toLocaleDateString('en-US', {
                  timeZone: city.tz,
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }
            } catch {
              timeStr = '--:--';
              dateStr = '';
            }

            return (
              <div
                key={city.id}
                className="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors text-xs"
              >
                <div className="min-w-0">
                  <div className="font-normal text-zinc-800 dark:text-zinc-200 truncate">
                    {city.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {dateStr}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm font-normal text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {timeStr}
                  </span>
                  <button
                    onClick={() => handleRemoveCity(city.id)}
                    className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 transition-opacity"
                    title={`Remove ${city.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {cities.length === 0 && (
            <div className="text-center py-4 text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              No cities selected &bull; Click &quot;Add City&quot; to pick
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
