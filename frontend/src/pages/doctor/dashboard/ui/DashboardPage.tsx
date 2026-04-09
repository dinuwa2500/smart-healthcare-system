'use client';
import { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle, Clock, Users, Activity, 
  ChevronRight, AlertCircle, Sparkles, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import type { DoctorProfile } from '@/src/entities/doctor/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';

export function DashboardPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    doctorApi.getMe()
      .then((r) => setProfile(r.data.data))
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateSlots = async () => {
    setGenerating(true);
    try {
      const res = await doctorApi.generateSlots();
      toast.success(`Success! Generated ${res.data.data.count} weekly slots.`);
    } catch {
      toast.error('Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner /></div>;
  if (!profile) return <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">Profile not found.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-700">
      {/* Header / Hero Section */}
      <section className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="h-4 w-4 text-teal-400" />
              Welcome back, Dr. {profile.lastName}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your dashboard is ready</h1>
            <p className="max-w-xl text-lg text-slate-400">Manage your patients, update your availability, and track your consultation performance all in one place.</p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
             <div className={`p-4 rounded-3xl border flex items-center gap-3 transition-all
               ${profile.isVerified 
                 ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' 
                 : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
               {profile.isVerified ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
               <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Status</p>
                  <p className="font-bold">{profile.isVerified ? 'Verified Account' : 'Pending Verification'}</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Patients', value: '124', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Today Appointments', value: '8', icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'Overall Rating', value: profile.rating.average.toFixed(1), icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Revenue (MTD)', value: '$2.4k', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="group rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl transition-all hover:-translate-y-1">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-opacity-80`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Availability Management */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Clock className="h-7 w-7 text-teal-600" />
              Availability Management
             </h2>
          </div>
          
          <div className="rounded-[40px] border border-white/40 bg-white/70 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl">
            <div className="text-center py-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-6">
                <Calendar className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Manage Your Slots</h3>
              <p className="mt-2 text-slate-500 max-w-sm mx-auto">Set your working hours so patients can book appointments with you. Start by generating a default 9-5 schedule.</p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button 
                  isLoading={generating} 
                  onClick={handleGenerateSlots}
                  className="h-14 rounded-2xl px-8 text-lg shadow-xl shadow-teal-600/20"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Weekly Slots
                </Button>
                <Button variant="secondary" className="h-14 rounded-2xl px-8 text-lg border-2">
                  View Schedule
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Notifications / Quick Actions */}
        <section className="space-y-6">
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Activity className="h-7 w-7 text-indigo-600" />
            Quick Actions
           </h2>
           <div className="space-y-4">
              {[
                { title: 'Update Profile', desc: 'Manage your bio and fee', icon: Users },
                { title: 'Recent Consultations', desc: 'View feedback and notes', icon: Activity },
                { title: 'My Patients', desc: 'Browse patient history', icon: Users },
              ].map((action, i) => (
                <button key={i} className="group w-full flex items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:text-teal-600 transition-colors">
                       <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{action.title}</p>
                      <p className="text-sm text-slate-500">{action.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                </button>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}
