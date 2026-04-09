'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Download, FileText, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/src/shared/api';
import { useAuthStore } from '@/src/shared/store/authStore';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

interface Report {
  _id: string;
  description: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const MAX_SIZE   = 10 * 1024 * 1024; // 10 MB
const ACCEPT_MAP = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] };

export function UploadReportPage() {
  const { user } = useAuthStore();
  const [reports,     setReports]     = useState<Report[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [description, setDescription] = useState('');
  const [file,        setFile]        = useState<File | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);

  const fetchReports = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get<{ success: boolean; data: Report[] }>('/patients/me/reports');
      setReports(res.data.data);
    } catch {
      toast.error('Could not load reports');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onDrop = useCallback((accepted: File[], rejected: { file: File }[]) => {
    if (rejected.length) { toast.error('File rejected – check type/size'); return; }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_MAP,
    maxFiles: 1,
    maxSize: MAX_SIZE,
  });

  const handleUpload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('report', file);
    form.append('description', description);

    setUploading(true);
    setProgress(0);
    try {
      await api.post('/patients/me/reports', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      toast.success('Report uploaded');
      setFile(null);
      setDescription('');
      setProgress(0);
      fetchReports();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const res = await api.get(`/files/${user?.id}/${report.storedName}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = report.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Reports"
        title="Keep your medical documents ready"
        description="Upload reports, prescriptions, or scan results once so they’re available when you need them during consultations."
        actions={
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {reports.length} file{reports.length !== 1 ? 's' : ''} stored securely
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div
              {...getRootProps()}
              className={cn(
                'rounded-[24px] border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50/70 hover:border-teal-400 hover:bg-white'
              )}
            >
              <input {...getInputProps()} />
              <Upload className={cn('mx-auto mb-4 h-11 w-11', isDragActive ? 'text-teal-600' : 'text-slate-400')} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-slate-800">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-4 w-4 text-slate-400 transition-colors hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-800">
                    {isDragActive ? 'Drop file here to upload' : 'Drag and drop a file or click to browse'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">PDF, JPG, and PNG supported up to 10 MB.</p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-5 space-y-4 rounded-[24px] bg-slate-50 p-5">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a short description to help identify this report later"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
                />
                {uploading && (
                  <div>
                    <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                      <span>Uploading your report</span><span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
                <Button isLoading={uploading} onClick={handleUpload}>Upload report</Button>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Uploaded reports</h2>
            <p className="mt-1 text-sm text-slate-500">Review what you’ve already shared and download copies any time.</p>

            {loadingList ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-slate-900">No reports uploaded yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add your first report to keep diagnoses, prescriptions, or scan results handy for future appointments.</p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100 rounded-[24px] border border-slate-200 bg-white">
                {reports.map((r) => (
                  <div key={r._id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{r.originalName}</p>
                        <p className="mt-1 text-xs text-slate-400">{r.description || 'No description'} · {formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(r)}
                      className="ml-4 shrink-0 rounded-2xl border border-slate-200 p-2.5 transition-colors hover:bg-teal-50"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-teal-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl shadow-slate-950/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Secure storage</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">Keep important medical files in one place so you can share accurate context with doctors when it matters.</p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-900">Best practices</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Name reports clearly so they’re easy to find later.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Upload test results before your appointment for faster review.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Use short descriptions like “Blood test – Jan 2026”.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
