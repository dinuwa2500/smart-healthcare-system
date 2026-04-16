"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Stethoscope,
  DollarSign,
  Briefcase,
  FileText,
  CheckCircle,
  Plus,
  Trash2,
  Globe,
  Camera,
  Award,
  Image,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { doctorApi } from "@/src/entities/doctor/api";
import type { DoctorProfile } from "@/src/entities/doctor/model";
import { Button } from "@/src/shared/ui/Button";
import { Spinner } from "@/src/shared/ui/Spinner";

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Psychiatry",
  "General Practice",
  "ENT",
  "Ophthalmology",
  "Oncology",
  "Urology",
];

export function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    consultationFee: 0,
    experienceYears: 0,
    bio: "",
    profilePicture: "",
    languages: [] as string[],
    qualifications: [] as {
      degree: string;
      institution: string;
      year: number;
    }[],
  });

  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    doctorApi
      .getMe()
      .then((r) => {
        const p = r.data.data;
        setProfile(p);
        setForm({
          firstName: p.firstName,
          lastName: p.lastName,
          specialization: p.specialization,
          consultationFee: p.consultationFee,
          experienceYears: p.experienceYears || 0,
          bio: p.bio || "",
          profilePicture: p.profilePicture || "",
          languages: p.languages || [],
          qualifications: p.qualifications || [],
        });
      })
      .catch(() => toast.error("Could not load profile settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorApi.updateMe(form);
      toast.success("Your profile has been updated successfully!", {
        icon: "💎",
        style: { borderRadius: "16px", background: "#333", color: "#fff" },
      });
      router.push("/doctor/dashboard");
    } catch {
      toast.error("Oof! Something went wrong updating your profile");
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    setForm((prev) => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        { degree: "", institution: "", year: new Date().getFullYear() },
      ],
    }));
  };

  const removeQualification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const updateQualification = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updated = [...form.qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setForm((prev) => ({ ...prev, qualifications: updated }));
  };

  const addLanguage = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newLanguage.trim()) {
      e.preventDefault();
      if (!form.languages.includes(newLanguage.trim())) {
        setForm((prev) => ({
          ...prev,
          languages: [...prev.languages, newLanguage.trim()],
        }));
      }
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }));
  };

  if (loading)
    return (
      <div className='flex h-[80vh] flex-col items-center justify-center gap-4'>
        <Spinner size='lg' />
        <p className='text-sm font-medium text-slate-500 animate-pulse'>
          Syncing your professional identity...
        </p>
      </div>
    );

  return (
    <div className='mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 px-4 sm:px-6'>
      {/* Header Overlay */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-20'>
        <button
          onClick={() => router.back()}
          className='group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all'
        >
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:shadow-indigo-500/10 group-hover:border-indigo-100 transition-all'>
            <ArrowLeft className='h-5 w-5' />
          </div>
          <div className='text-left'>
            <span className='block text-[10px] font-bold uppercase tracking-widest text-slate-400'>
              Navigation
            </span>
            <span className='text-sm font-bold'>Return Home</span>
          </div>
        </button>

        <div
          className={`flex items-center gap-3 rounded-2xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-sm border transition-all ${
            profile?.isVerified
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-500/5"
              : "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-500/5"
          }`}
        >
          {profile?.isVerified ? (
            <CheckCircle className='h-4 w-4' />
          ) : (
            <Clock className='h-4 w-4' />
          )}
          {profile?.isVerified
            ? "Elite Verified Practitioner"
            : "Verification Documentation Pending"}
        </div>
      </div>

      <div className='rounded-[48px] border border-white/50 bg-white/70 p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] backdrop-blur-[40px] relative overflow-hidden ring-1 ring-slate-200/50'>
        {/* Decorative Background Elements */}
        <div className='absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-[100px] pointer-events-none' />
        <div className='absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 blur-[100px] pointer-events-none' />

        <div className='relative z-10'>
          <div className='mb-14 flex flex-col items-center sm:items-start text-center sm:text-left gap-2'>
            <h1 className='text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl'>
              Professional Profile
            </h1>
            <p className='text-lg text-slate-500 font-medium'>
              Elevate your digital presence for patients across our healthcare
              network.
            </p>
          </div>

          <form onSubmit={handleSave} className='space-y-14'>
            {/* Section: Identity & Image */}
            <section className='space-y-10'>
              <div className='flex flex-col sm:flex-row items-center gap-10'>
                <div className='relative group shrink-0'>
                  <div className='h-40 w-40 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200'>
                    {form.profilePicture ? (
                      <img
                        src={form.profilePicture}
                        alt='Avatar Preview'
                        className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
                      />
                    ) : (
                      <div className='h-full w-full bg-slate-100 flex items-center justify-center text-slate-300'>
                        <UserIcon className='h-16 w-16' />
                      </div>
                    )}
                  </div>
                  <div className='absolute -bottom-4 -right-4 h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/40 ring-4 ring-white group-hover:scale-110 transition-all'>
                    <Camera className='h-5 w-5' />
                  </div>
                </div>
                <div className='flex-1 w-full space-y-6'>
                  <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                    <Image className='h-4 w-4' /> Identity & Visuals
                  </h2>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-xs font-bold text-slate-500 uppercase tracking-wider ml-1'>
                        First Name
                      </label>
                      <input
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                        className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 shadow-sm'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-xs font-bold text-slate-500 uppercase tracking-wider ml-1'>
                        Last Name
                      </label>
                      <input
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                        className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 shadow-sm'
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-xs font-bold text-slate-500 uppercase tracking-wider ml-1'>
                      Profile Photo URL
                    </label>
                    <input
                      placeholder='https://images.unsplash.com/photo-...'
                      value={form.profilePicture}
                      onChange={(e) =>
                        setForm({ ...form, profilePicture: e.target.value })
                      }
                      className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-xs font-mono text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white shadow-sm'
                    />
                    <p className='text-[10px] text-slate-400 font-medium italic px-1'>
                      Provide a direct image URL (PNG, JPG) for best
                      compatibility.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Professional Details */}
            <section className='space-y-8 p-10 rounded-[40px] bg-slate-50/50 border border-slate-100 border-dashed'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <Stethoscope className='h-4 w-4' /> Professional Vertical
              </h2>

              <div className='grid gap-8 sm:grid-cols-2'>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2'>
                    <Award className='h-3.5 w-3.5 text-indigo-500' /> Primary
                    Specialization
                  </label>
                  <div className='relative'>
                    <select
                      value={form.specialization}
                      onChange={(e) =>
                        setForm({ ...form, specialization: e.target.value })
                      }
                      className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 appearance-none shadow-sm cursor-pointer'
                    >
                      <option value=''>Select Specialization</option>
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs uppercase tracking-widest'>
                      Choose
                    </div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2'>
                    <Briefcase className='h-3.5 w-3.5 text-indigo-500' />{" "}
                    Professional Experience
                  </label>
                  <div className='relative'>
                    <div className='absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs'>
                      YEARS
                    </div>
                    <input
                      type='number'
                      value={form.experienceYears}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experienceYears: Number(e.target.value),
                        })
                      }
                      className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 shadow-sm'
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Academic Qualifications */}
            <section className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                  <Award className='h-4 w-4' /> Clinical Qualifications
                </h2>
                <button
                  type='button'
                  onClick={addQualification}
                  className='group flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-200/50 active:scale-95'
                >
                  <Plus className='h-4 w-4 transition-transform group-hover:rotate-90' />{" "}
                  Add Credential
                </button>
              </div>

              <div className='space-y-4'>
                {form.qualifications.length === 0 ? (
                  <div className='p-10 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 text-center text-slate-400'>
                    <p className='text-xs font-bold'>
                      No credentials added. Patient confidence builds with
                      verified qualifications.
                    </p>
                  </div>
                ) : (
                  form.qualifications.map((q, idx) => (
                    <div
                      key={idx}
                      className='group flex flex-col sm:flex-row gap-4 p-5 rounded-[28px] border-2 border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all hover:border-indigo-100 relative'
                    >
                      <div className='flex-1 grid gap-4 sm:grid-cols-3'>
                        <div className='space-y-1'>
                          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                            Degree
                          </span>
                          <input
                            placeholder='M.D. / Ph.D'
                            value={q.degree}
                            onChange={(e) =>
                              updateQualification(idx, "degree", e.target.value)
                            }
                            className='w-full border-none p-0 text-sm font-bold text-indigo-900 placeholder:text-slate-300 outline-none'
                          />
                        </div>
                        <div className='space-y-1'>
                          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                            Institution
                          </span>
                          <input
                            placeholder='University Name'
                            value={q.institution}
                            onChange={(e) =>
                              updateQualification(
                                idx,
                                "institution",
                                e.target.value,
                              )
                            }
                            className='w-full border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none'
                          />
                        </div>
                        <div className='space-y-1'>
                          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                            Year
                          </span>
                          <input
                            type='number'
                            value={q.year}
                            onChange={(e) =>
                              updateQualification(
                                idx,
                                "year",
                                Number(e.target.value),
                              )
                            }
                            className='w-full border-none p-0 text-sm font-black text-emerald-600 outline-none'
                          />
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeQualification(idx)}
                        className='h-10 w-10 shrink-0 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100'
                      >
                        <Trash2 className='h-5 w-5' />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Section: Languages */}
            <section className='space-y-6'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <Globe className='h-4 w-4' /> Linguistics
              </h2>
              <div className='p-8 rounded-[40px] border-2 border-slate-100 bg-white space-y-4 shadow-sm'>
                <div className='flex flex-wrap gap-2'>
                  {form.languages.map((lang) => (
                    <span
                      key={lang}
                      className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg animate-in zoom-in duration-300'
                    >
                      {lang}
                      <button
                        type='button'
                        onClick={() => removeLanguage(lang)}
                        className='rounded-lg p-0.5 hover:bg-white/20'
                      >
                        <Trash2 className='h-3 w-3' />
                      </button>
                    </span>
                  ))}
                  <div className='relative flex-1 min-w-[200px]'>
                    <Globe className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <input
                      placeholder='Add language (Press Enter)...'
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={addLanguage}
                      className='w-full h-11 pl-11 rounded-xl border-none bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all'
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Pricing */}
            <section className='space-y-6'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <DollarSign className='h-4 w-4' /> Consultation Fee
                Configuration
              </h2>

              <div className='max-w-md group bg-white border-2 border-slate-100 rounded-[40px] p-8 shadow-sm hover:border-emerald-100 transition-all'>
                <label className='text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2 block mb-4'>
                  Standard Visit Fee (LKR)
                </label>
                <div className='relative'>
                  <div className='absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500'>
                    Rs.
                  </div>
                  <input
                    type='number'
                    value={form.consultationFee}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        consultationFee: Number(e.target.value),
                      })
                    }
                    className='w-full rounded-[32px] border-none bg-emerald-50/50 p-6 pl-16 text-4xl font-black text-slate-950 outline-none transition-all focus:bg-emerald-50'
                  />
                </div>
                <div className='mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 text-amber-700'>
                  <div className='h-2 w-2 rounded-full bg-amber-500 animate-pulse' />
                  <p className='text-[10px] font-bold uppercase tracking-widest'>
                    Pricing visible to all patients globally
                  </p>
                </div>
              </div>
            </section>

            {/* Section: Bio */}
            <section className='space-y-6'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <FileText className='h-4 w-4' /> Clinical Narrative
              </h2>
              <div className='relative'>
                <div className='absolute top-4 left-4 h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 pointer-events-none'>
                  <FileText className='h-5 w-5' />
                </div>
                <textarea
                  rows={8}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder='Articulate your medical journey, philosophy, and expertise...'
                  className='w-full rounded-[40px] border-2 border-slate-100 bg-white p-8 pl-18 text-base font-medium leading-relaxed text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-500 focus:ring-[20px] focus:ring-indigo-500/5 resize-none shadow-sm'
                />
              </div>
            </section>

            <div className='pt-8'>
              <Button
                type='submit'
                isLoading={saving}
                className='w-full h-20 rounded-[32px] text-xl font-bold bg-slate-950 text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 group'
              >
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 group-hover:scale-110 transition-transform'>
                  <Save className='h-5 w-5' />
                </div>
                Transmit Profile Changes
              </Button>
              <p className='mt-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                All modifications are securely encrypted and replicated across
                our healthcare nodes.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
