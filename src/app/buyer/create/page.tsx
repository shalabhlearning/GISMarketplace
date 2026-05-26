'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  Eye,
  Upload,
  Save,
  Trash2,
  Globe,
  Mail,
  User,
  DollarSign,
  Clock,
  Lock,
  Unlock,
  ChevronRight,
  X,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  title: string;
  description: string;
  budget: string;
  currency: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  visibility: string;
  contactPerson: string;
  contactEmail: string;
  credits: string;
  attachments: File[];
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  budget: '',
  currency: 'USD',
  startDate: '',
  endDate: '',
  submissionDeadline: '',
  visibility: 'public',
  contactPerson: '',
  contactEmail: '',
  credits: '0',
  attachments: [],
};

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Project Details',     icon: FileText  },
  { id: 2, label: 'Timeline & Budget',   icon: Calendar  },
  { id: 3, label: 'Visibility & Contact',icon: Globe     },
  { id: 4, label: 'Attachments',         icon: Upload    },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
    }`}>
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
        : <AlertCircle   className="w-5 h-5 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Drafts Drawer ────────────────────────────────────────────────────────────
function DraftsDrawer({
  open,
  onClose,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (draft: any) => void;
}) {
  const [drafts, setDrafts]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/rfp/get-drafts', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setDrafts(Array.isArray(d) ? d : []))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleDelete = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(draftId);
    try {
      await fetch(`/api/rfp/delete-draft?draft_id=${draftId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setDrafts(prev => prev.filter(d => d.draft_id !== draftId));
    } catch {}
    setDeleting(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3 text-white">
            <FolderOpen className="w-5 h-5" />
            <h2 className="text-lg font-bold">Saved Drafts</h2>
            {drafts.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {drafts.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading drafts…</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <FolderOpen className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-center">No saved drafts yet.<br />Save a draft to see it here.</p>
            </div>
          ) : (
            drafts.map((d) => (
              <div
                key={d.draft_id}
                onClick={() => { onLoad(d); onClose(); }}
                className="group relative p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {d.title || 'Untitled Draft'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {d.description ? d.description.slice(0, 90) + (d.description.length > 90 ? '…' : '') : 'No description'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {d.budget && (
                        <span className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                          {d.currency === 'INR' ? '₹' : '$'}{Number(d.budget).toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(d.draft_id, e)}
                      disabled={deleting === d.draft_id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete draft"
                    >
                      {deleting === d.draft_id
                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          Click a draft to load it into the form
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateRFPPage() {
  const router = useRouter();

  const [formData, setFormData]         = useState<FormData>({ ...EMPTY_FORM });
  const [currentStep, setCurrentStep]   = useState(1);
  const [loading, setLoading]           = useState(false);
  const [savingDraft, setSavingDraft]   = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [toast, setToast]               = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...Array.from(files)] }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const loadDraft = (draft: any) => {
    setFormData({
      title:               draft.title               || '',
      description:         draft.description         || '',
      budget:              draft.budget?.toString()  || '',
      currency:            draft.currency            || 'USD',
      startDate:           draft.start_date          || '',
      endDate:             draft.end_date            || '',
      submissionDeadline:  draft.submission_deadline || '',
      visibility:          draft.visibility          || 'public',
      contactPerson:       draft.contact_person      || '',
      contactEmail:        draft.contact_email       || '',
      credits:             draft.credits?.toString() || '0',
      attachments:         [],
    });
    setCurrentStep(1);
    showToast('Draft loaded! Continue editing below.', 'success');
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      showToast('Please add a project title before saving.', 'error');
      return;
    }
    setSavingDraft(true);
    try {
      const res = await fetch('/api/rfp/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachments: [] }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Draft saved successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append('title',             formData.title);
    fd.append('description',       formData.description);
    fd.append('budget',            formData.budget);
    fd.append('currency',          formData.currency);
    fd.append('visibility',        formData.visibility);
    fd.append('contactPerson',     formData.contactPerson);
    fd.append('contactEmail',      formData.contactEmail);
    fd.append('credits',           formData.credits);
    fd.append('startDate',         formData.startDate);
    fd.append('endDate',           formData.endDate);
    fd.append('submissionDeadline',formData.submissionDeadline);
    formData.attachments.forEach(f => fd.append('attachments', f));

    try {
      const res  = await fetch('/api/rfp/create', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();

      if (res.ok) {
        showToast('RFP published successfully! Redirecting…', 'success');
        setTimeout(() => router.push('/buyer'), 1800);
      } else {
        showToast(data.error || 'Failed to publish RFP', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived preview values ──────────────────────────────────────────────────
  const currencySymbol = formData.currency === 'INR' ? '₹' : '$';
  const formatBudget   = formData.budget
    ? `${currencySymbol}${parseFloat(formData.budget).toLocaleString()}`
    : '—';

  const stepComplete = (step: number) => {
    if (step === 1) return !!formData.title && !!formData.description;
    if (step === 2) return !!formData.submissionDeadline;
    if (step === 3) return !!formData.contactPerson && !!formData.contactEmail;
    return true;
  };

  return (
    <DashboardShell title="Create New RFP">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Drafts Drawer */}
      <DraftsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLoad={loadDraft}
      />

      <div className="py-6 space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New RFP</h1>
            <p className="text-gray-500 mt-1 text-sm">Fill in the details to publish your request for proposals.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-sm font-medium text-gray-700 hover:text-emerald-700 transition-all shadow-sm"
          >
            <FolderOpen className="w-4 h-4" />
            Saved Drafts
          </button>
        </div>

        {/* ── Step Progress ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const done    = stepComplete(step.id);
              const active  = currentStep === step.id;
              const visited = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className="flex items-center gap-2.5 group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      active   ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' :
                      (visited && done) ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {visited && done && !active
                        ? <CheckCircle2 className="w-4 h-4" />
                        : step.id}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block transition-colors ${
                      active ? 'text-emerald-700' : visited && done ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${
                      currentStep > step.id && stepComplete(step.id) ? 'bg-emerald-300' : 'bg-gray-100'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Step 1 — Project Details */}
                {currentStep === 1 && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
                        <p className="text-sm text-gray-500">Define the core aspects of your RFP.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Project Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Smart City GIS Infrastructure Mapping 2025"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Project Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={8}
                        placeholder="Describe scope, objectives, deliverables, and success criteria in detail…"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
                      />
                      <p className="text-xs text-gray-400 mt-1.5 text-right">{formData.description.length} characters</p>
                    </div>
                  </div>
                )}

                {/* Step 2 — Timeline & Budget */}
                {currentStep === 2 && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Timeline & Budget</h2>
                        <p className="text-sm text-gray-500">Set dates and financial expectations.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                            className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected End Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                            className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Submission Deadline <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input type="datetime-local" name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} required
                            className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Budget <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-gray-50">
                          <select name="currency" value={formData.currency} onChange={handleChange}
                            className="bg-gray-100 px-4 py-3 text-gray-700 border-r border-gray-200 focus:outline-none font-medium text-sm">
                            <option value="USD">USD $</option>
                            <option value="INR">INR ₹</option>
                          </select>
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input name="budget" type="number" step="0.01" value={formData.budget} onChange={handleChange} placeholder="0.00"
                              className="w-full pl-9 pr-4 py-3 bg-transparent text-gray-900 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 — Visibility & Contact */}
                {currentStep === 3 && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Visibility & Contact</h2>
                        <p className="text-sm text-gray-500">Control access and add contact info.</p>
                      </div>
                    </div>

                    {/* Visibility toggle cards */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Visibility</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: 'public',  label: 'Public',  desc: 'Visible to all providers', icon: Unlock, color: 'emerald' },
                          { value: 'private', label: 'Private', desc: 'Invite-only access',        icon: Lock,   color: 'amber'   },
                        ].map(({ value, label, desc, icon: Icon, color }) => (
                          <label key={value} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            formData.visibility === value
                              ? color === 'emerald' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-400 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                            <input type="radio" name="visibility" value={value} checked={formData.visibility === value} onChange={handleChange} className="sr-only" />
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${color === 'emerald' ? 'text-emerald-600' : 'text-amber-500'}`} />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                                <p className="text-xs text-gray-500">{desc}</p>
                              </div>
                            </div>
                            {formData.visibility === value && (
                              <CheckCircle2 className={`absolute top-3 right-3 w-4 h-4 ${color === 'emerald' ? 'text-emerald-600' : 'text-amber-500'}`} />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Contact Person <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required placeholder="Full name"
                            className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Contact Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required placeholder="email@company.com"
                            className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Attachments */}
                {currentStep === 4 && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Attachments</h2>
                        <p className="text-sm text-gray-500">Upload supporting documents (PDF, DOCX, XLSX — max 10MB each).</p>
                      </div>
                    </div>

                    <div
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/30 rounded-2xl p-10 text-center cursor-pointer transition-all group"
                    >
                      <div className="w-14 h-14 bg-white border border-gray-200 group-hover:border-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transition-all">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <p className="text-gray-700 font-semibold mb-1">Drag & drop files here</p>
                      <p className="text-sm text-gray-400">or <span className="text-emerald-600 font-medium">click to browse</span></p>
                      <input ref={fileInputRef} type="file" multiple hidden onChange={e => handleFileChange(e.target.files)} />
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">{formData.attachments.length} file(s) attached</p>
                        {formData.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                            <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button type="button" onClick={() => removeAttachment(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step Navigation ──────────────────────────────────────── */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                      <button type="button" onClick={() => setCurrentStep(s => s - 1)}
                        className="px-5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                        ← Back
                      </button>
                    )}

                    {/* Save Draft */}
                    <button type="button" onClick={handleSaveDraft} disabled={savingDraft}
                      className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50">
                      {savingDraft
                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        : <Save className="w-4 h-4" />}
                      Save Draft
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {currentStep < STEPS.length ? (
                      <button type="button" onClick={() => setCurrentStep(s => s + 1)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-200 transition-all">
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button type="submit" disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-200 transition-all">
                        {loading
                          ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Publishing…</>
                          : <><Plus className="w-4 h-4" /> Publish RFP</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ── Live Preview Sidebar ────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4" />
                  <h3 className="font-bold text-sm uppercase tracking-wide">Live Preview</h3>
                </div>
                <p className="text-emerald-100 text-xs">Updates as you type</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Title</p>
                  <p className="font-semibold text-gray-900 leading-snug">
                    {formData.title || <span className="text-gray-300 font-normal italic">Not specified</span>}
                  </p>
                </div>

                {/* Budget */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Budget
                  </p>
                  <p className="text-2xl font-bold text-emerald-800">{formatBudget}</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Start', val: formData.startDate },
                    { label: 'End',   val: formData.endDate   },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label} Date</p>
                      <p className="text-sm font-medium text-gray-800">
                        {val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Deadline */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Deadline
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {formData.submissionDeadline
                      ? new Date(formData.submissionDeadline).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-2.5">
                  {formData.visibility === 'public'
                    ? <><Unlock className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700">Public</span></>
                    : <><Lock    className="w-4 h-4 text-amber-500"   /><span className="text-sm font-semibold text-amber-600">Private</span></>}
                </div>

                {/* Contact */}
                {(formData.contactPerson || formData.contactEmail) && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-800 font-medium">{formData.contactPerson || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-600 truncate">{formData.contactEmail || '—'}</p>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {formData.attachments.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attachments</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-medium">{formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}

                {/* Completion meter */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">Completion</p>
                    <p className="text-xs font-bold text-emerald-700">
                      {Math.round((STEPS.filter(s => stepComplete(s.id)).length / STEPS.length) * 100)}%
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((STEPS.filter(s => stepComplete(s.id)).length / STEPS.length) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}