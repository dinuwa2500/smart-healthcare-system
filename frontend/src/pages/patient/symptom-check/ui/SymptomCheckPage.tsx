'use client';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, History, ShieldAlert, Sparkles, Stethoscope, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { symptomCheckApi } from '@/src/entities/symptom-check/api';
import type { SymptomCheck, SymptomCheckResult, Severity, UrgencyLevel } from '@/src/entities/symptom-check/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { Badge } from '@/src/shared/ui/Badge';
import { formatDate } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

// ── Urgency config ────────────────────────────────────────────
const URGENCY_CONFIG: Record<UrgencyLevel, {
  label: string; color: string; bg: string; icon: ReactNode; badgeVariant: 'success' | 'info' | 'warning' | 'danger';
}> = {
  routine:   { label: 'Routine',   color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: <CheckCircle  className="h-5 w-5 text-green-600"  />, badgeVariant: 'success' },
  soon:      { label: 'See Soon',  color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: <Clock        className="h-5 w-5 text-blue-600"   />, badgeVariant: 'info'    },
  urgent:    { label: 'Urgent',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />, badgeVariant: 'warning' },
  emergency: { label: 'Emergency', color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    icon: <ShieldAlert  className="h-5 w-5 text-red-600"    />, badgeVariant: 'danger'  },
};

const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// ── Result card ───────────────────────────────────────────────
function ResultCard({ result, onClose }: { result: SymptomCheckResult; onClose: () => void }) {
  const urg = URGENCY_CONFIG[result.urgencyLevel] ?? URGENCY_CONFIG.routine;

  return (
    <div className={cn('rounded-[28px] border-2 p-6 space-y-5 shadow-sm', urg.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {urg.icon}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Urgency</p>
            <p className={cn('text-lg font-bold', urg.color)}>{urg.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/10 transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Specialty */}
      <div className="rounded-lg bg-white/80 px-4 py-3 flex items-center gap-3">
        <Stethoscope className="h-5 w-5 text-teal-600 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">Suggested Specialty</p>
          <p className="font-semibold text-gray-900">{result.suggestedSpecialty}</p>
        </div>
      </div>

      {/* Advice */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">General Advice</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.generalAdvice}</p>
      </div>

      {/* Red flags */}
      {result.redFlags.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Warning Signs
          </p>
          <ul className="space-y-1">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 italic border-t border-current/20 pt-3">
        {result.disclaimer}
      </p>

      {result.fallback && (
        <Badge variant="warning" className="text-xs">
          AI unavailable – showing general guidance
        </Badge>
      )}
    </div>
  );
}

// ── History panel ─────────────────────────────────────────────
function HistoryPanel() {
  const [checks,  setChecks]  = useState<SymptomCheck[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    symptomCheckApi.getHistory({ limit: 20 })
      .then((r) => { setChecks(r.data.data.checks); setTotal(r.data.data.total); })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (checks.length === 0) {
    return <p className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 py-10 text-center text-sm text-slate-400 shadow-sm">No previous checks found.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{total} check{total !== 1 ? 's' : ''} total</p>
      {checks.map((c) => {
        const urg = URGENCY_CONFIG[c.urgencyLevel] ?? URGENCY_CONFIG.routine;
        return (
          <div key={c._id} className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="max-w-xs truncate text-sm font-medium text-slate-800">{c.symptoms}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDate(c.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={urg.badgeVariant}>{urg.label}</Badge>
                <span className="text-xs text-teal-700 font-medium">{c.suggestedSpecialty}</span>
              </div>
            </div>
            {c.generalAdvice && (
              <p className="mt-2 line-clamp-2 text-xs text-slate-500">{c.generalAdvice}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function SymptomCheckPage() {
  const [symptoms,  setSymptoms]  = useState('');
  const [severity,  setSeverity]  = useState<Severity | ''>('');
  const [duration,  setDuration]  = useState('');
  const [age,       setAge]       = useState('');
  const [gender,    setGender]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<SymptomCheckResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleCheck = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.trim().length < 10) {
      toast.error('Please describe your symptoms in at least 10 characters');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await symptomCheckApi.check({
        symptoms: symptoms.trim(),
        severity:  severity  || undefined,
        duration:  duration  || undefined,
        age:       age       ? Number(age)  : undefined,
        gender:    gender    || undefined,
      });
      const nextResult = {
        ...res.data.data,
        fallback: Boolean(res.data.fallback),
      };
      setResult(nextResult);
      if (nextResult.fallback) {
        toast('AI model unavailable – showing general guidance', { icon: '⚠️' });
      }
    } catch (err: unknown) {
      if ((err as { response?: { status: number } }).response?.status === 503) {
        toast.error('AI service is temporarily unavailable. Try again shortly.');
      } else if ((err as { response?: { status: number } }).response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error('Symptom check failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [symptoms, severity, duration, age, gender]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Symptom checker"
        title="Get quick guidance before you book"
        description="Describe your symptoms and receive urgency guidance with a suggested specialty. This supports care decisions but does not replace a medical diagnosis."
        actions={
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
              showHistory ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Back to checker' : 'View history'}
          </button>
        }
      />

      {showHistory ? (
        <HistoryPanel />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <form onSubmit={handleCheck} className="space-y-5 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your symptoms <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400">(min 10 chars)</span>
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. I have a persistent headache on the right side for 3 days, along with sensitivity to light…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
              <p className={cn('mt-1 text-xs', symptoms.length < 10 && symptoms.length > 0 ? 'text-red-500' : 'text-gray-400')}>
                {symptoms.length} chars
              </p>
            </div>

            {/* Severity + Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(severity === s ? '' : s)}
                      className={cn(
                        'flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors',
                        severity === s
                          ? s === 'mild'     ? 'bg-green-500  text-white border-green-500'
                          : s === 'moderate' ? 'bg-yellow-500 text-white border-yellow-500'
                          :                   'bg-red-500    text-white border-red-500'
                          : 'border-gray-300 text-gray-600 hover:border-teal-400'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 days"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select…</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              disabled={symptoms.trim().length < 10}
              className="w-full"
            >
              {loading ? 'Analysing symptoms…' : 'Check My Symptoms'}
            </Button>

            {loading && (
              <p className="text-center text-xs text-gray-400 animate-pulse">
                AI is analysing your symptoms — this may take up to 30 seconds…
              </p>
            )}
          </form>

          {result && (
            <div className="mt-6">
              <ResultCard result={result} onClose={() => setResult(null)} />
            </div>
          )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl shadow-slate-950/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">How this helps</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Use the symptom checker when you’re unsure where to start. It can help you understand urgency and choose the right specialist faster.</p>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <h3 className="text-base font-semibold text-slate-900">Best results come from</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Describing symptoms clearly and including duration.</li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Mentioning severity and any warning signs you notice.</li>
                <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Booking an appointment if symptoms persist or worsen.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
