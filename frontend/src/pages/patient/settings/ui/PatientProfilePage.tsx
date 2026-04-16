"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Heart,
  Home,
  Phone,
  Calendar,
  ShieldAlert,
  Plus,
  Trash2,
  Camera,
  Activity,
  Droplets,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientApi } from "@/src/entities/patient/api";
import { PatientProfile } from "@/src/entities/patient/model";
import { Button } from "@/src/shared/ui/Button";
import { Spinner } from "@/src/shared/ui/Spinner";

export function PatientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "" as "male" | "female" | "other",
    phone: "",
    profilePicture: "",
    bloodType: "",
    allergies: [] as string[],
    address: {
      street: "",
      city: "",
      district: "",
      postalCode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const [newAllergy, setNewAllergy] = useState("");

  useEffect(() => {
    patientApi
      .getMe()
      .then((r) => {
        const p = r.data.data;
        setProfile(p);
        setForm({
          firstName: p.firstName,
          lastName: p.lastName,
          dob: p.dob ? new Date(p.dob).toISOString().split("T")[0] : "",
          gender: p.gender || "other",
          phone: p.phone || "",
          profilePicture: p.profilePicture || "",
          bloodType: p.bloodType || "",
          allergies: p.allergies || [],
          address: {
            street: p.address?.street || "",
            city: p.address?.city || "",
            district: p.address?.district || "",
            postalCode: p.address?.postalCode || "",
          },
          emergencyContact: {
            name: p.emergencyContact?.name || "",
            phone: p.emergencyContact?.phone || "",
            relationship: p.emergencyContact?.relationship || "",
          },
        });
      })
      .catch(() => toast.error("Could not load your profile settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientApi.updateMe(form);
      toast.success("Profile updated successfully!", {
        icon: "🚀",
        style: { borderRadius: "16px", background: "#333", color: "#fff" },
      });
      router.push("/patient/dashboard");
    } catch {
      toast.error("Something went wrong updating your profile");
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newAllergy.trim()) {
      e.preventDefault();
      if (!form.allergies.includes(newAllergy.trim())) {
        setForm((prev) => ({
          ...prev,
          allergies: [...prev.allergies, newAllergy.trim()],
        }));
      }
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  if (loading)
    return (
      <div className='flex h-[80vh] flex-col items-center justify-center gap-4'>
        <Spinner size='lg' />
        <p className='text-sm font-medium text-slate-500 animate-pulse'>
          Syncing your health profile...
        </p>
      </div>
    );

  return (
    <div className='mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 px-4 sm:px-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-20'>
        <button
          onClick={() => router.back()}
          className='group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:shadow-teal-500/10 group-hover:border-teal-100 transition-all'>
            <ArrowLeft className='h-5 w-5' />
          </div>
          <div className='text-left'>
            <span className='block text-[10px] font-bold uppercase tracking-widest text-slate-400'>
              Back to dashboard
            </span>
            <span className='text-sm font-bold'>Account Settings</span>
          </div>
        </button>

        <div className='flex items-center gap-3 rounded-2xl bg-teal-50 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-teal-700 border border-teal-100 shadow-sm shadow-teal-500/5'>
          <ShieldAlert className='h-4 w-4' />
          Secure Health Profile
        </div>
      </div>

      <div className='rounded-[48px] border border-white/50 bg-white/70 p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] backdrop-blur-[40px] relative overflow-hidden ring-1 ring-slate-200/50'>
        {/* Decor */}
        <div className='absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/10 blur-[100px] pointer-events-none' />
        <div className='absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 blur-[100px] pointer-events-none' />

        <div className='relative z-10'>
          <div className='mb-14 flex flex-col items-center sm:items-start text-center sm:text-left gap-2'>
            <h1 className='text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl'>
              Edit Profile
            </h1>
            <p className='text-lg text-slate-500 font-medium'>
              Manage your personal information, address, and medical records.
            </p>
          </div>

          <form onSubmit={handleSave} className='space-y-14'>
            {/* Identity & Visuals */}
            <section className='space-y-10'>
              <div className='flex flex-col sm:flex-row items-center gap-10'>
                <div className='relative group shrink-0'>
                  <div className='h-40 w-40 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200'>
                    {form.profilePicture ? (
                      <img
                        src={form.profilePicture}
                        alt='Avatar'
                        className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
                      />
                    ) : (
                      <div className='h-full w-full bg-slate-100 flex items-center justify-center text-slate-300'>
                        <UserIcon className='h-16 w-16' />
                      </div>
                    )}
                  </div>
                  <div className='absolute -bottom-4 -right-4 h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xl shadow-teal-500/40 ring-4 ring-white group-hover:scale-110 transition-all'>
                    <Camera className='h-5 w-5' />
                  </div>
                </div>

                <div className='flex-1 w-full space-y-6'>
                  <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                    <Activity className='h-4 w-4' /> Personal Identity
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
                        className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-8 focus:ring-teal-500/5 shadow-sm'
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
                        className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-8 focus:ring-teal-500/5 shadow-sm'
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-xs font-bold text-slate-500 uppercase tracking-wider ml-1'>
                      Profile Photo URL
                    </label>
                    <input
                      placeholder='https://images.unsplash.com/...'
                      value={form.profilePicture}
                      onChange={(e) =>
                        setForm({ ...form, profilePicture: e.target.value })
                      }
                      className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-xs font-mono text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white shadow-sm'
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Vital Details */}
            <section className='space-y-8 p-10 rounded-[40px] bg-slate-50/50 border border-slate-100 border-dashed'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <Calendar className='h-4 w-4' /> Bio & Demographics
              </h2>

              <div className='grid gap-8 sm:grid-cols-2'>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1'>
                    Date of Birth
                  </label>
                  <input
                    type='date'
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 shadow-sm'
                  />
                </div>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1'>
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gender: e.target.value as "male" | "female" | "other",
                      })
                    }
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 appearance-none shadow-sm cursor-pointer'>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 shadow-sm'
                  />
                </div>
                <div className='space-y-3'>
                  <label className='text-xs font-bold text-slate-700 uppercase tracking-wider ml-1'>
                    Blood Type
                  </label>
                  <select
                    value={form.bloodType}
                    onChange={(e) =>
                      setForm({ ...form, bloodType: e.target.value })
                    }
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 appearance-none shadow-sm cursor-pointer'>
                    <option value=''>Select Blood Type</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* Address Details */}
            <section className='space-y-8'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <Home className='h-4 w-4' /> Living Address
              </h2>
              <div className='grid gap-6 sm:grid-cols-2'>
                <div className='space-y-2 sm:col-span-2'>
                  <label className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Street Address
                  </label>
                  <input
                    value={form.address.street}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, street: e.target.value },
                      })
                    }
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    City
                  </label>
                  <input
                    value={form.address.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, city: e.target.value },
                      })
                    }
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Postal Code
                  </label>
                  <input
                    value={form.address.postalCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: {
                          ...form.address,
                          postalCode: e.target.value,
                        },
                      })
                    }
                    className='w-full rounded-2xl border-2 border-slate-100 bg-white/50 p-4 text-sm font-bold text-slate-900'
                  />
                </div>
              </div>
            </section>

            {/* Medical Metrics */}
            <section className='space-y-6'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <ShieldAlert className='h-4 w-4' /> Allergy Safeguards
              </h2>
              <div className='p-8 rounded-[40px] border-2 border-slate-100 bg-white space-y-4 shadow-sm'>
                <div className='flex flex-wrap gap-2'>
                  {form.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className='inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/20'>
                      {allergy}
                      <button
                        type='button'
                        onClick={() => removeAllergy(allergy)}
                        className='rounded-lg p-0.5 hover:bg-white/20'>
                        <Trash2 className='h-3 w-3' />
                      </button>
                    </span>
                  ))}
                  <div className='relative flex-1 min-w-[200px]'>
                    <input
                      placeholder='Add allergy and press Enter...'
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyDown={addAllergy}
                      className='w-full h-11 px-4 rounded-xl border-none bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all'
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Emergency Info */}
            <section className='space-y-6'>
              <h2 className='text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2'>
                <Droplets className='h-4 w-4' /> Emergency Contact
              </h2>
              <div className='grid gap-6 p-8 rounded-[40px] bg-amber-50/50 border border-amber-100 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <label className='text-[10px] font-black text-amber-600 uppercase tracking-widest'>
                    Contact Name
                  </label>
                  <input
                    value={form.emergencyContact.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContact: {
                          ...form.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    className='w-full border-none bg-transparent p-0 text-sm font-bold text-amber-900 outline-none placeholder:text-amber-200'
                    placeholder='Guardian Name'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-[10px] font-black text-amber-600 uppercase tracking-widest'>
                    Phone Number
                  </label>
                  <input
                    value={form.emergencyContact.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContact: {
                          ...form.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    className='w-full border-none bg-transparent p-0 text-sm font-bold text-amber-900 outline-none placeholder:text-amber-200'
                    placeholder='+94 7X XXX XXXX'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-[10px] font-black text-amber-600 uppercase tracking-widest'>
                    Relationship
                  </label>
                  <input
                    value={form.emergencyContact.relationship}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContact: {
                          ...form.emergencyContact,
                          relationship: e.target.value,
                        },
                      })
                    }
                    className='w-full border-none bg-transparent p-0 text-sm font-bold text-amber-900 outline-none placeholder:text-amber-200'
                    placeholder='e.g. Spouse / Parent'
                  />
                </div>
              </div>
            </section>

            <div className='pt-8'>
              <Button
                type='submit'
                isLoading={saving}
                className='w-full h-20 rounded-[32px] text-xl font-bold bg-teal-600 text-white shadow-[0_20px_40px_-10px_rgba(20,184,166,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.4)] active:scale-95 transition-all flex items-center justify-center gap-4 group'>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 group-hover:scale-110 transition-transform'>
                  <Save className='h-5 w-5' />
                </div>
                Securely Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
