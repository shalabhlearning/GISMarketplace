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
} from 'lucide-react';

export default function CreateRFPPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
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
    attachments: [] as File[],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load latest draft
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await fetch('/api/rfp/get-draft', {
          credentials: 'include',
        });
        const data = await res.json();

        if (data) {
          const draft = Array.isArray(data) ? data[0] : data;
          setFormData((prev) => ({
            ...prev,
            title: draft.title || '',
            description: draft.description || '',
            budget: draft.budget || '',
            currency: draft.currency || 'USD',
            startDate: draft.start_date || '',
            endDate: draft.end_date || '',
            submissionDeadline: draft.submission_deadline || '',
            visibility: draft.visibility || 'public',
            contactPerson: draft.contact_person || '',
            contactEmail: draft.contact_email || '',
            credits: draft.credits || '0',
            attachments: [],
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadDraft();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }));
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: any) => e.preventDefault();

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDraft = async () => {
    try {
      const res = await fetch('/api/rfp/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachments: [] }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to save draft', type: 'error' });
      }
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      setMessage({ text: 'Failed to save draft', type: 'error' });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const fd = new FormData();

    fd.append('title', formData.title || '');
    fd.append('description', formData.description || '');
    fd.append('budget', formData.budget || '');
    fd.append('currency', formData.currency || 'USD');
    fd.append('visibility', formData.visibility || 'public');
    fd.append('contactPerson', formData.contactPerson || '');
    fd.append('contactEmail', formData.contactEmail || '');
    fd.append('credits', formData.credits || '0');

    fd.append('startDate', formData.startDate || '');
    fd.append('endDate', formData.endDate || '');
    fd.append('submissionDeadline', formData.submissionDeadline || '');

    formData.attachments.forEach((file) => {
      fd.append('attachments', file);
    });

    try {
      const res = await fetch('/api/rfp/create', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: 'RFP created successfully! Redirecting to dashboard...',
          type: 'success'
        });

        // Redirect to Buyer Dashboard after showing success message
        setTimeout(() => {
          router.push('/buyer');
        }, 1500);
      } else {
        setMessage({ text: data.error || 'Failed to create RFP', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = formData.currency === 'USD' ? '$' : '₹';
  const formatBudget = formData.budget
    ? `${currencySymbol}${parseFloat(formData.budget).toLocaleString()}`
    : '-';

  const projectIdPreview = `RFP-${new Date().getFullYear()}-AUTO`;

  return (
    <DashboardShell title="Create New RFP">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">

        {/* FORM */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-12 bg-white rounded-2xl shadow-lg p-8">

            {/* Project Details */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                <FileText className="w-7 h-7 text-blue-600" /> Project Details
              </h2>
              <p className="text-sm text-gray-600 mb-6">Define the core aspects of your request for proposal.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. New Marketing Campaign for Q4 Product Launch"
                    className="w-full bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={9}
                    placeholder="Provide detailed scope, objectives, deliverables, success criteria..."
                    className="w-full bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Timeline & Budget */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                <Calendar className="w-7 h-7 text-blue-600" /> Timeline & Budget
              </h2>
              <p className="text-sm text-gray-600 mb-6">Set important dates and financial expectations.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Proposal Submission Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Budget (optional)</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:border-blue-500 transition-all">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="bg-gray-50 px-4 py-3.5 text-gray-700 border-r border-gray-300 focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                    <input
                      name="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="flex-1 bg-white px-4 py-3.5 text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Visibility & Contact */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                <Globe className="w-7 h-7 text-blue-600" /> Visibility & Contact
              </h2>
              <p className="text-sm text-gray-600 mb-6">Control who can see and respond to this RFP.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Public</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={formData.visibility === 'private'}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Private</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                      placeholder="Full name"
                      className="w-full pl-11 bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      placeholder="email@company.com"
                      className="w-full pl-11 bg-gray-50/70 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                <Upload className="w-7 h-7 text-blue-600" /> Attachments
              </h2>
              <p className="text-sm text-gray-600 mb-5">Upload supporting documents (PDF, DOCX, XLSX, images, max 10MB per file)</p>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer bg-gray-50/40"
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 font-medium mb-1">Drag & drop files here or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  click to browse
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </div>

              {formData.attachments.length > 0 && (
                <div className="mt-6 space-y-3">
                  {formData.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-10 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-7 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/rfp/get-drafts', {
                      credentials: 'include',
                    });
                    const data = await res.json();
                    setDrafts(Array.isArray(data) ? data : []);
                    setShowDraftModal(true);
                  } catch (err) {
                    console.error("❌ Fetch drafts error:", err);
                  }
                }}
                className="px-7 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Preview Drafts
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl ml-auto hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish RFP'}
              </button>
            </div>
          </form>

          {/* Message */}
          {message && (
            <p className={`text-center mt-6 font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:block hidden">
          <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-6 text-white">
              <h3 className="text-2xl font-semibold flex items-center gap-3">
                <Eye className="w-6 h-6" /> RFP Summary & Cost Preview
              </h3>
              <p className="text-blue-100 mt-1.5 text-sm">Review before publishing</p>
            </div>

            <div className="p-7 space-y-7">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Project Title
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formData.title || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <span className="text-blue-600 font-bold">#</span> Project ID
                </div>
                <div className="text-base font-medium text-gray-800 font-mono">
                  {projectIdPreview}
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100">
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" /> Estimated Budget
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {formatBudget || '—'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> Start Date
                  </div>
                  <div className="text-gray-900 font-medium">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> End Date
                  </div>
                  <div className="text-gray-900 font-medium">
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Submission Deadline
                </div>
                <div className="text-gray-900 font-medium">
                  {formData.submissionDeadline ? new Date(formData.submissionDeadline).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : '—'}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  {formData.visibility === 'public' ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600" />
                  )}
                  Visibility
                </div>
                <div className="text-gray-900 font-semibold capitalize">
                  {formData.visibility}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Contact Information
                </div>
                <div className="space-y-1.5 text-gray-900">
                  <div className="font-medium">{formData.contactPerson || '—'}</div>
                  <div className="text-gray-600 text-sm">{formData.contactEmail || '—'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" /> Attachments
                </div>
                <div className="text-gray-900 font-medium">
                  {formData.attachments.length} file(s) attached
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-black mb-4">Saved Drafts</h2>

            {drafts.length === 0 && <p className="text-gray-500">No drafts found</p>}

            {drafts.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {drafts.map((d, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFormData({
                        title: d.title || '',
                        description: d.description || '',
                        budget: d.budget || '',
                        currency: d.currency || 'USD',
                        startDate: d.start_date || '',
                        endDate: d.end_date || '',
                        submissionDeadline: d.submission_deadline || '',
                        visibility: d.visibility || 'public',
                        contactPerson: d.contact_person || '',
                        contactEmail: d.contact_email || '',
                        credits: d.credits || '0',
                        attachments: [],
                      });
                      setShowDraftModal(false);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900">{d.title || 'Untitled Draft'}</p>
                    <p className="text-sm text-gray-500">
                      {d.description ? d.description.slice(0, 80) : 'No description'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowDraftModal(false)}
              className="mt-5 px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}