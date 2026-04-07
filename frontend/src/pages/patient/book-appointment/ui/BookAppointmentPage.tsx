'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowRight, CalendarClock, CheckCircle, ChevronRight, CreditCard, Lock, Search, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { appointmentApi } from '@/src/entities/appointment/api';
import { paymentApi } from '@/src/entities/payment/api';
import type { DoctorProfile, DoctorSlot } from '@/src/entities/doctor/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { useAuthStore } from '@/src/shared/store/authStore';
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
  const [date, setDate]       = useState('');
  const [slots, setSlots]     = useState<DoctorSlot[]>([]);
  const [time, setTime]       = useState('');
  const [type, setType]       = useState<'video' | 'in_person'>('video');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate next 14 days for the beautiful horizontal picker
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setTime('');
    doctorApi.getSlots(doctor._id, date)
      .then((r) => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, doctor._id]);

  const morningSlots   = slots.filter(s => parseInt(s.startTime.split(':')[0]) < 12);
  const afternoonSlots = slots.filter(s => parseInt(s.startTime.split(':')[0]) >= 12);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Select Date</label>
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Next 14 days available</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 mask-fade-right">
          {dates.map((d) => (
            <button
              key={d.full}
              onClick={() => setDate(d.full)}
              className={`flex min-w-[72px] flex-col items-center justify-center rounded-2xl border-2 py-3 transition-all duration-300
                ${date === d.full 
                  ? 'border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/50'}`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${date === d.full ? 'text-teal-100' : 'text-slate-400'}`}>{d.dayName}</span>
              <span className="text-xl font-bold leading-none my-1">{d.dayNum}</span>
              <span className="text-[10px] font-medium">{d.month}</span>
            </button>
          ))}
        </div>
      </section>

      {date && (
        <section className="animate-in fade-in zoom-in-95 duration-500">
          <label className="block text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6">Available Times</label>
          
          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <CalendarClock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No time slots found for this date.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {morningSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="h-px flex-1 bg-slate-100" /> Morning <span className="h-px flex-1 bg-slate-100" />
                  </h4>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {morningSlots.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setTime(s.startTime)}
                        className={`group relative rounded-xl px-4 py-2.5 text-sm font-bold border-2 transition-all duration-300
                          ${time === s.startTime
                            ? 'border-teal-600 bg-teal-600 text-white shadow-md'
                            : 'border-slate-100 bg-white text-slate-700 hover:border-teal-300 hover:scale-105'}`}
                      >
                        {s.startTime}
                        {time === s.startTime && <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full border-2 border-teal-600 animate-bounce" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {afternoonSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="h-px flex-1 bg-slate-100" /> Afternoon <span className="h-px flex-1 bg-slate-100" />
                  </h4>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {afternoonSlots.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setTime(s.startTime)}
                        className={`relative rounded-xl px-4 py-2.5 text-sm font-bold border-2 transition-all duration-300
                          ${time === s.startTime
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                            : 'border-slate-100 bg-white text-slate-700 hover:border-indigo-300 hover:scale-105'}`}
                      >
                        {s.startTime}
                        {time === s.startTime && <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full border-2 border-indigo-600 animate-bounce" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section>
        <label className="block text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Consultation Type</label>
        <div className="grid grid-cols-2 gap-4">
          {(['video', 'in_person'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold border-2 transition-all duration-300
                ${type === t 
                  ? 'border-teal-600 bg-teal-50 text-teal-700 ring-4 ring-teal-600/5' 
                  : 'border-slate-100 bg-white text-slate-500 hover:border-teal-200'}`}
            >
              <span className="text-xl">{t === 'video' ? '📽️' : '🏥'}</span>
              <span>{t === 'video' ? 'Video Consultation' : 'In-Person Visit'}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="pt-2">
        <Button 
          disabled={!date || !time} 
          onClick={() => onNext(date, time, type)}
          className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-teal-600/20 active:scale-95"
          variant="primary"
        >
          Continue to Reason <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="rounded-[24px] overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Search className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold">Dr. {doctor.firstName} {doctor.lastName}</h4>
            <div className="flex items-center gap-2 mt-1 text-teal-100/80 text-sm">
              <span className="bg-white/20 px-2 py-0.5 rounded-md font-semibold">{doctor.specialization}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{formatCurrency(fee)} per visit</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 text-center sm:text-left min-w-[140px]">
             <p className="text-[10px] font-bold text-teal-200/70 uppercase">Reserved Slot</p>
             <p className="font-bold text-sm mt-0.5">{formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
             <p className="text-xs">{time}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Reason for visit</label>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors 
            ${reason.length < 10 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
            {reason.length} / 10 characters min.
          </span>
        </div>
        <textarea
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please describe your symptoms or what you'd like to discuss during the consultation..."
          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/5 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="ghost" onClick={onBack} className="h-12 order-2 sm:order-1 sm:w-1/3">Go Back</Button>
        <Button 
          disabled={reason.trim().length < 10} 
          onClick={() => onNext(reason.trim())}
          className="h-12 rounded-xl order-1 sm:order-2 flex-1 shadow-lg shadow-teal-600/10"
        >
          Secure Checkout
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 inner: Stripe PaymentElement form ──────────────────
function PaymentForm({ fee, paymentId, appointmentData, onSuccess, onBack }: {
  fee: number;
  paymentId: string;
  appointmentData: { 
    doctorId: string; 
    doctorName: string;
    doctorSpecialty: string;
    consultationFee: number;
    patientName: string;
    slotDate: string; 
    slotTime: string; 
    consultationType: 'video' | 'in_person'; 
    reason: string 
  };
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
      // 1. Book the appointment (creates pending appt)
      const apptRes = await appointmentApi.book(appointmentData);
      const appointmentId = apptRes.data.data._id;

      // 2. Confirm Stripe payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/patient/my-appointments' },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message ?? 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 3. Manual Sync (since we don't have webhooks)
        await paymentApi.confirm(paymentId, appointmentId);
        onSuccess(appointmentId);
      } else {
        // Should not happen for standard Card flow if redirect is 'if_required'
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-teal-600" />
        <span>Your payment information is encrypted and processed securely via Stripe.</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button 
          variant="secondary" 
          onClick={onBack} 
          disabled={paying}
          className="h-12 order-2 sm:order-1 sm:w-1/3"
        >
          Cancel
        </Button>
        <Button 
          isLoading={paying} 
          onClick={handlePay}
          className="h-12 order-1 sm:order-2 flex-1 rounded-xl bg-teal-600 shadow-lg shadow-teal-600/20"
        >
          <Lock className="mr-2 h-4 w-4" />
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

  const { user } = useAuthStore();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const intentCalled = useRef(false);

  useEffect(() => {
    if (!user || intentCalled.current) return;
    intentCalled.current = true;
    
    setLoadingPayment(true);
    paymentApi.createIntent({ 
      appointmentId: 'pending', 
      amount: doctor.consultationFee,
      patientId: user.id,
      doctorId: doctor.authUserId
    })
      .then((r) => {
        setClientSecret(r.data.data.clientSecret);
        setPaymentId(r.data.data.paymentId);
      })
      .catch((err) => {
        console.error('Payment init error:', err);
        setError('Could not initialise payment. Please check your connection and try again.');
      })
      .finally(() => setLoadingPayment(false));
  }, [doctor._id, user?.id, doctor.consultationFee]);

  if (error) return (
    <div className="rounded-[28px] border-2 border-red-100 bg-red-50 p-8 text-center">
      <p className="text-red-700 font-medium mb-4">{error}</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );

  if (!clientSecret || loadingPayment) return (
    <div className="space-y-6 py-10">
      <div className="h-40 w-full animate-pulse rounded-[32px] bg-slate-100" />
      <div className="space-y-3">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-50" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-50" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Order Summary Card */}
      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur-xl">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Order Summary
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
              <p className="text-xs text-slate-500">{doctor.specialization} · Consultation</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs font-medium text-slate-400 uppercase">{formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
             <p className="font-bold text-slate-900">{time}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total Consultation Fee</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(doctor.consultationFee)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Payment Method</h3>
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret, 
            appearance: { 
              theme: 'flat',
              variables: {
                colorPrimary: '#0d9488',
                colorBackground: '#ffffff',
                colorText: '#1e293b',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '16px',
                spacingGridRow: '16px'
              },
              rules: {
                '.Input': {
                  border: '2px solid #f1f5f9',
                  boxShadow: 'none',
                },
                '.Input:focus': {
                  border: '2px solid #0d9488',
                }
              }
            } 
          }}
        >
          <PaymentForm
            fee={doctor.consultationFee}
            paymentId={paymentId}
            appointmentData={{ 
              doctorId: doctor.authUserId, 
              doctorName: `${doctor.firstName} ${doctor.lastName}`,
              doctorSpecialty: doctor.specialization,
              consultationFee: doctor.consultationFee,
              patientName: user?.name || user?.email || 'Patient',
              slotDate: date, 
              slotTime: time, 
              consultationType: type, 
              reason 
            }}
            onSuccess={onSuccess}
            onBack={onBack}
          />
        </Elements>
      </div>
    </div>
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

      <div className="rounded-[40px] border border-white/40 bg-white/70 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-teal-50/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl" />
        
        <div className="relative z-10">
          <Stepper step={step} />

          <div className="mt-8 transition-all duration-500 ease-in-out">
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
      </div>
    </div>
  );
}
