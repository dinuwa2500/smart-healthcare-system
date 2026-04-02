'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, User as UserIcon, Stethoscope, 
  DollarSign, Briefcase, FileText, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import type { DoctorProfile } from '@/src/entities/doctor/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';

const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics',
  'Gynecology', 'Psychiatry', 'General Practice', 'ENT', 'Ophthalmology',
  'Oncology', 'Urology',
];

export function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    specialization:  '',
    consultationFee: 0,
    experienceYears: 0,
    bio:             '',
  });

  useEffect(() => {
    doctorApi.getMe()
      .then((r) => {
        const p = r.data.data;
        setProfile(p);
        setForm({
          firstName:       p.firstName,
          lastName:        p.lastName,
          specialization:  p.specialization,
          consultationFee: p.consultationFee,
          experienceYears: p.experienceYears || 0,
          bio:             p.bio || '',
        });
      })
      .catch(() => toast.error('Could not load profile settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorApi.updateMe(form);
      toast.success('Profile updated successfully!');
      router.push('/doctor/dashboard');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
           <CheckCircle className="h-4 w-4" />
           {profile?.isVerified ? 'Verified Provider' : 'Verification Pending'}
        </div>
      </div>

      <div className="rounded-[40px] border border-white/40 bg-white/70 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-teal-50/50 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl opacity-50" />

        <div className="relative z-10">
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Profile Settings</h1>
            <p className="mt-2 text-slate-500">Update your professional information and consultation pricing.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Section: Basic Information */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Basic Information
              </h2>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input
                    readOnly // Name changes should be reserved for verification
                    value={form.firstName}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input
                    readOnly
                    value={form.lastName}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Section: Professional Details */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Professional Details
              </h2>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Specialization</label>
                  <select
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 appearance-none"
                  >
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 pl-12 text-sm text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Pricing */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Consultation Fee
              </h2>
              
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-semibold text-slate-700">Fee per visit (LKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rs.</span>
                  <input
                    type="number"
                    value={form.consultationFee}
                    onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 pl-12 text-lg font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5"
                  />
                </div>
                <p className="text-[10px] text-slate-400 px-2 italic">This fee will be displayed to patients during the booking flow.</p>
              </div>
            </section>

            {/* Section: Bio */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Professional Bio
              </h2>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Short Biography</label>
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Describe your background, expertise, and how you can help patients..."
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 resize-none"
                />
              </div>
            </section>

            <div className="pt-6">
              <Button 
                type="submit" 
                isLoading={saving}
                className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-teal-600/20 active:scale-95"
              >
                <Save className="mr-2 h-5 w-5" /> Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
