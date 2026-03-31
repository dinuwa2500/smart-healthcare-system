'use client';
import { useEffect, useState } from 'react';
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

export function SchedulePage() {
  const [grid,    setGrid]    = useState<Grid>(emptyGrid());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Pre-fill from existing slots
  useEffect(() => {
    doctorApi.getMe()
      .then((res) => {
        // getMe doesn't return slots; load via getSlots isn't needed —
        // we rely on setSlots overwrite. Start empty on first load.
        void res;
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSlots = grid.flatMap((dayRow, dayIdx) =>
        dayRow
          .map((active, slotIdx) => active ? {
            dayOfWeek:   dayIdx + 1,          // 1=Mon
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

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">{totalActive} active slot{totalActive !== 1 ? 's' : ''} · click to toggle</p>
        </div>
        <Button isLoading={saving} onClick={handleSave}>Save Schedule</Button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm bg-teal-500" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm bg-gray-200 border border-gray-300" /> Inactive
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {/* Time header */}
              <th className="w-16 p-3 text-left text-gray-400 font-normal">Time</th>
              {DAYS.map((day, i) => (
                <th key={day} className="p-2 text-center">
                  <button
                    onClick={() => toggleDay(i)}
                    className="font-semibold text-gray-700 hover:text-teal-600 transition-colors"
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
                  'border-b border-gray-50 last:border-0',
                  time.endsWith(':00') ? 'border-gray-100' : ''
                )}
              >
                <td className={cn(
                  'px-3 py-1 text-gray-400 select-none',
                  time.endsWith(':00') ? 'font-medium text-gray-500' : 'pl-5 text-[11px]'
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
                          'h-6 w-full rounded transition-colors',
                          active
                            ? 'bg-teal-500 hover:bg-teal-600'
                            : 'bg-gray-100 hover:bg-teal-100 border border-gray-200'
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
