'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { cn } from '@/src/shared/lib/cn';

const DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// 08:00 to 18:00 in 30-min increments = 20 slots
const SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

// Grid state: day index (0-6) × slot index (0-19) = boolean
type Grid = boolean[][];
const emptyGrid = (): Grid => Array.from({ length: 7 }, () => Array(SLOTS.length).fill(false));

function SummaryCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

export function SchedulePage() {
  const [grid,    setGrid]    = useState<Grid>(emptyGrid());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Pre-fill from existing slots
  useEffect(() => {
    doctorApi.getMe()
      .then(async (res) => {
        const profile = res.data.data;
        const slotsRes = await doctorApi.getSlots(profile._id);
        const slots = slotsRes.data.data;

        setGrid((prev) => {
          const next = prev.map((r) => [...r]);
          slots.forEach((s) => {
            const dayIdx = s.dayOfWeek; // 0=Mon
            const slotIdx = SLOTS.indexOf(s.startTime);
            if (dayIdx >= 0 && dayIdx < 7 && slotIdx !== -1) {
              next[dayIdx][slotIdx] = s.isActive;
            }
          });
          return next;
        });
      })
      .catch(() => {/* no profile yet */})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (day: number, slot: number) =>
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[day][slot] = !next[day][slot];
      return next;
    });

  const toggleDay = (day: number) => {
    const allOn = grid[day].every(Boolean);
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[day] = next[day].map(() => !allOn);
      return next;
    });
  };

  const setWeekdays = () => {
    setGrid((prev) => prev.map((row, index) => row.map(() => index < 5)));
  };

  const clearAll = () => {
    setGrid(emptyGrid());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSlots = grid.flatMap((dayRow, dayIdx) =>
        dayRow
          .map((active, slotIdx) => active ? {
            dayOfWeek:   dayIdx,              // 0=Mon, ..., 6=Sun
            startTime:   SLOTS[slotIdx],
            duration:    30,
            isActive:    true,
          } : null)
          .filter(Boolean)
      ) as { dayOfWeek: number; startTime: string; duration: number; isActive: boolean }[];

      await doctorApi.setSlots(activeSlots);
      toast.success(`Schedule saved – ${activeSlots.length} active slot${activeSlots.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const totalActive = grid.flat().filter(Boolean).length;
  const activeDays = grid.filter((row) => row.some(Boolean)).length;
  const weeklyHours = (totalActive * 0.5).toFixed(totalActive % 2 === 0 ? 0 : 1);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Weekly availability
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Set a predictable consultation schedule that patients can trust.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Toggle individual time blocks, enable or disable entire days, and save a clean weekly availability pattern.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={setWeekdays} className="rounded-2xl px-4 py-2">
              Weekdays only
            </Button>
            <Button variant="secondary" onClick={clearAll} className="rounded-2xl px-4 py-2">
              Clear all
            </Button>
            <Button isLoading={saving} onClick={handleSave} className="rounded-2xl px-5 py-2.5">
              Save Schedule
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Active slots" value={String(totalActive)} helper="30-minute appointments enabled" icon={<CalendarDays className="h-5 w-5" />} />
        <SummaryCard label="Active days" value={String(activeDays)} helper="Days with at least one available slot" icon={<Clock className="h-5 w-5" />} />
        <SummaryCard label="Weekly hours" value={`${weeklyHours}h`} helper="Approximate open consultation time" icon={<Sparkles className="h-5 w-5" />} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm bg-teal-500" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border border-gray-300 bg-gray-200" /> Inactive
        </span>
        <span className="text-slate-400">Click a day label to toggle the full column.</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-[32px] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {/* Time header */}
              <th className="w-16 p-3 text-left font-normal text-slate-400">Time</th>
              {DAYS.map((day, i) => (
                <th key={day} className="p-2 text-center">
                  <button
                    onClick={() => toggleDay(i)}
                    className="rounded-xl px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-600"
                    title={`Toggle all ${day}`}
                  >
                    {DAY_SHORT[i]}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((time, slotIdx) => (
              <tr
                key={time}
                className={cn(
                  'border-b border-slate-50 last:border-0',
                  time.endsWith(':00') ? 'border-slate-100' : ''
                )}
              >
                <td className={cn(
                  'select-none px-3 py-1 text-slate-400',
                  time.endsWith(':00') ? 'font-medium text-slate-500' : 'pl-5 text-[11px]'
                )}>
                  {time}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const active = grid[dayIdx][slotIdx];
                  return (
                    <td key={dayIdx} className="p-0.5 text-center">
                      <button
                        onClick={() => toggle(dayIdx, slotIdx)}
                        title={`${DAYS[dayIdx]} ${time}`}
                        className={cn(
                          'h-6 w-full rounded transition-colors focus:outline-none focus:ring-2 focus:ring-teal-200',
                          active
                            ? 'bg-teal-500 hover:bg-teal-600'
                            : 'border border-gray-200 bg-gray-100 hover:bg-teal-100'
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
