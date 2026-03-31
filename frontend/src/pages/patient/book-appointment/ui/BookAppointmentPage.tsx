'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowRight, CalendarClock, CheckCircle, ChevronRight, Search, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { appointmentApi } from '@/src/entities/appointment/api';
import { paymentApi } from '@/src/entities/payment/api';
import type { DoctorProfile, DoctorSlot } from '@/src/entities/doctor/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '');

// ── Step indicator ────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  const steps = ['Select Slot', 'Reason', 'Payment'];
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
            ${i < step ? 'bg-teal-600 text-white' : i === step ? 'bg-teal-600 text-white ring-4 ring-teal-100' : 'bg-gray-200 text-gray-500'}`}>
            {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-sm ${i === step ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Slot picker ───────────────────────────────────────
function SlotStep({ doctor, onNext }: {
  doctor: DoctorProfile;
  onNext: (date: string, time: string, type: 'video' | 'in_person') => void;
}) {
  const today = new Date();
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 30);

  const [date, setDate]       = useState('');
  const [slots, setSlots]     = useState<DoctorSlot[]>([]);
  const [time, setTime]       = useState('');
  const [type, setType]       = useState<'video' | 'in_person'>('video');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setTime('');
    doctorApi.getSlots(doctor._id, date)
      .then((r) => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, doctor._id]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
        <input
          type="date"
          min={today.toISOString().slice(0, 10)}
          max={maxDate.toISOString().slice(0, 10)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
          {loadingSlots ? (
            <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-20 animate-pulse rounded-lg bg-gray-200" />
            ))}</div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No slots available on this date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setTime(s.startTime)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors
                    ${time === s.startTime
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 text-gray-700 hover:border-teal-400'}`}
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
        <div className="flex gap-3">
          {(['video', 'in_person'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors
                ${type === t ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-700 hover:border-teal-400'}`}
            >
              {t === 'video' ? '📹 Video' : '🏥 In-Person'}
            </button>
          ))}
        </div>
      </div>

      <Button disabled={!date || !time} onClick={() => onNext(date, time, type)}>
        Continue
      </Button>
    </div>
  );
}

// ── Step 2: Reason ────────────────────────────────────────────
function ReasonStep({ doctor, date, time, fee, onNext, onBack }: {
  doctor: DoctorProfile; date: string; time: string; fee: number;
  onNext: (reason: string) => void; onBack: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-1">
        <p className="font-semibold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</p>
        <p className="text-sm text-teal-700">{doctor.specialization}</p>
        <p className="text-sm text-gray-600">{formatDate(date)} at {time}</p>
        <p className="text-sm font-semibold text-gray-800 mt-2">Fee: {formatCurrency(fee)}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for visit <span className="text-gray-400">(min 10 chars)</span>
        </label>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe your symptoms or reason for visiting…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button disabled={reason.trim().length < 10} onClick={() => onNext(reason.trim())}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 inner: Stripe PaymentElement form ──────────────────
function PaymentForm({ fee, appointmentData, onSuccess, onBack }: {
  fee: number;
  appointmentData: { doctorId: string; slotDate: string; slotTime: string; consultationType: 'video' | 'in_person'; reason: string };
  onSuccess: (appointmentId: string) => void;
  onBack: () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      // 1. Book the appointment
      const apptRes = await appointmentApi.book(appointmentData);
      const appointmentId = apptRes.data.data._id;

      // 2. Confirm Stripe payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/patient/my-appointments' },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message ?? 'Payment failed');
      } else {
        onSuccess(appointmentId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={paying}>Back</Button>
        <Button isLoading={paying} onClick={handlePay}>
          Pay {formatCurrency(fee)}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 wrapper: fetches clientSecret then renders Elements ─
function PaymentStep({ doctor, date, time, type, reason, onSuccess, onBack }: {
  doctor: DoctorProfile; date: string; time: string;
  type: 'video' | 'in_person'; reason: string;
  onSuccess: (id: string) => void; onBack: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId]       = useState('');
  const [error, setError]               = useState('');

  useEffect(() => {
    paymentApi.createIntent({ appointmentId: 'pending', amount: doctor.consultationFee })
      .then((r) => {
        setClientSecret(r.data.data.clientSecret);
        setPaymentId(r.data.data.paymentId);
      })
      .catch(() => setError('Could not initialise payment. Please try again.'));
  }, [doctor.consultationFee]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!clientSecret) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <PaymentForm
        fee={doctor.consultationFee}
        appointmentData={{ doctorId: doctor._id, slotDate: date, slotTime: time, consultationType: type, reason }}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}

// ── Confirmed screen ──────────────────────────────────────────
function ConfirmedScreen({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center py-16 text-center gap-4">
      <CheckCircle className="h-16 w-16 text-teal-600" />
      <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
      <p className="text-gray-500 text-sm">Appointment ID: <span className="font-mono">{appointmentId}</span></p>
      <Button onClick={() => router.push('/patient/my-appointments')}>View My Appointments</Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function BookAppointmentPage() {
  const searchParams = useSearchParams();
  const doctorId     = searchParams.get('doctorId') ?? '';

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep]       = useState(0);
  const [confirmedId, setConfirmedId] = useState('');

  // Slot selections carried between steps
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'video' | 'in_person'>('video');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    doctorApi.getById(doctorId)
      .then((r) => setDoctor(r.data.data))
      .catch(() => toast.error('Doctor not found'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/70 bg-white/85 shadow-sm backdrop-blur"><Spinner /></div>;

  if (!doctorId) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-2">
        <PatientPageHeader
          eyebrow="Book appointment"
          title="Choose a doctor before booking"
          description="Start by exploring specialists, then select the doctor who best fits your needs to continue with scheduling and payment."
        />
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
            <UserRound className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">No doctor selected yet</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">Pick a specialist first so you can see available slots, choose the consultation type, and complete your booking with confidence.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/patient/find-doctors" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              Find doctors
              <Search className="h-4 w-4" />
            </Link>
            <Link href="/patient/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-2">
        <PatientPageHeader
          eyebrow="Book appointment"
          title="Doctor not found"
          description="The selected doctor may no longer be available. Choose another specialist to continue."
        />
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
          <CalendarClock className="mx-auto h-12 w-12 text-slate-300" />
          <Link href="/patient/find-doctors" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            Browse doctors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (confirmedId) return <ConfirmedScreen appointmentId={confirmedId} />;

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Book appointment"
        title={`Schedule with Dr. ${doctor.firstName} ${doctor.lastName}`}
        description="Pick a slot, add your reason for visit, and complete payment in a clear 3-step flow."
        actions={
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {doctor.specialization} · {formatCurrency(doctor.consultationFee)}
          </div>
        }
      />

      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <Stepper step={step} />

        {step === 0 && (
          <SlotStep
            doctor={doctor}
            onNext={(d, t, ct) => { setDate(d); setTime(t); setType(ct); setStep(1); }}
          />
        )}
        {step === 1 && (
          <ReasonStep
            doctor={doctor} date={date} time={time} fee={doctor.consultationFee}
            onNext={(r) => { setReason(r); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <PaymentStep
            doctor={doctor} date={date} time={time} type={type} reason={reason}
            onSuccess={(id) => setConfirmedId(id)}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}
