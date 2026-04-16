'use client';
import { useState } from 'react';
import { Plus, Trash2, Download, Stethoscope, Pill, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { appointmentApi } from '@/src/entities/appointment/api';
import { Modal } from '@/src/shared/ui/Modal';
import { Button } from '@/src/shared/ui/Button';
import { generatePrescriptionPDF } from '../lib/generatePrescriptionPDF';
import { cn } from '@/src/shared/lib/cn';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours', 'As needed', 'Weekly'];

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  onCompleted?: () => void;
}

const emptyMed = (): Medication => ({
  name: '', dosage: '', frequency: 'Twice daily', durationDays: 7, instructions: '',
});

export function IssuePrescriptionModal({
  isOpen, onClose, appointmentId, patientId, patientName, doctorName, onCompleted,
}: Props) {
  const [meds, setMeds] = useState<Medication[]>([emptyMed()]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const updateMed = (i: number, field: keyof Medication, value: string | number) =>
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const addMed = () => setMeds((prev) => [...prev, emptyMed()]);
  const removeMed = (i: number) => setMeds((prev) => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    return meds.length > 0 && meds.every((m) => m.name.trim() !== '' && m.dosage.trim() !== '');
  };

  const handleSave = async () => {
    if (!validate()) {
      setShowErrors(true);
      toast.error('Please fill out the name and dosage for all medications.');
      return;
    }

    setSaving(true);
    try {
      await doctorApi.issuePrescription({ appointmentId, patientId, medications: meds, notes });
      await appointmentApi.updateStatus(appointmentId, 'completed', notes);
      toast.success('Prescription issued & appointment completed successfully.');
      onCompleted?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setShowErrors(true);
    try {
      await generatePrescriptionPDF({
        appointmentId,
        patientId,
        patientName,
        doctorName,
        meds,
        notes,
      });
      toast.success('PDF Generated Successfully');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-4 mb-6 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-teal-800 px-6 py-5 text-white shadow-inner sm:-px-0 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Issue Digital Prescription</h2>
              <p className="text-xs font-medium text-teal-100/80">Ref: {appointmentId.slice(-8)} • Patient: {patientName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
              <Pill className="h-4 w-4" /> Clinical Medications
            </h3>
            {meds.length > 0 && (
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">{meds.length} item{meds.length !== 1 && 's'}</span>
            )}
          </div>

          {meds.length === 0 ? (
            <div 
              onClick={addMed}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition-colors hover:border-teal-300 hover:bg-teal-50/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 group-hover:bg-teal-100 transition-colors">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-teal-600" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600 group-hover:text-teal-700">Add a medication to this prescription</p>
            </div>
          ) : (
            <div className="space-y-5">
              {meds.map((med, i) => {
                const isError = showErrors && (!med.name.trim() || !med.dosage.trim());
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "relative rounded-[20px] bg-slate-50 p-5 shadow-sm transition-all duration-300 animate-in slide-in-from-left-4 fade-in",
                      isError ? "border-2 border-red-200 ring-4 ring-red-50" : "border border-slate-200 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-50"
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {i + 1}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Medication Entry</span>
                      </div>
                      <button 
                        onClick={() => removeMed(i)} 
                        className="flex items-center justify-center rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Remove Medication"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Medicine Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="e.g. Amoxicillin"
                          value={med.name} 
                          onChange={(e) => updateMed(i, 'name', e.target.value)}
                          className={cn(
                            "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2",
                            showErrors && !med.name.trim() ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Dosage <span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="e.g. 500mg"
                          value={med.dosage} 
                          onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                          className={cn(
                            "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2",
                            showErrors && !med.dosage.trim() ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4 mb-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Frequency</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        >
                          {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Days</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={String(med.durationDays)}
                          onChange={(e) => updateMed(i, 'durationDays', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Patient Instructions (Optional)</label>
                      <input
                        placeholder="e.g. Take after meals with plenty of water"
                        value={med.instructions} 
                        onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-start">
            <button
              onClick={addMed}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-teal-50 hover:ring-teal-300"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /> 
              Add Another Medication
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Clinical Remarks
          </h3>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific diagnostic notes, follow-up instructions, or lifestyle recommendations for the patient here..."
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 transition-shadow focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50 resize-none"
          />
        </div>
        
        {showErrors && !validate() && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-100">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p>Please fix the missing required fields marked in red above.</p>
          </div>
        )}

      </div>

      <div className="-mx-6 -mb-4 mt-2 flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row rounded-b-xl">
        <Button variant="ghost" onClick={onClose} disabled={saving} className="w-full sm:w-auto text-slate-500">
          Cancel
        </Button>
        <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-3">
          <Button 
            variant="secondary" 
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" /> Download Draft
          </Button>
          <Button 
            isLoading={saving} 
            onClick={handleSave}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> 
            Complete & Issue
          </Button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </Modal>
  );
}
