'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useState, useRef } from 'react';
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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'attachments') {
        formData.attachments.forEach((file) => fd.append('attachments', file));
      } else {
        fd.append(key, value as string);
      }
    });

    try {
      const res = await fetch('/api/rfp/create', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'RFP created successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to create RFP', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error – please check your connection', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = formData.currency === 'USD' ? '$' : '₹';

  const formatBudget = formData.budget
    ? `${currencySymbol}${parseFloat(formData.budget).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '-';

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatDateTime = (dateTime: string) =>
    dateTime
      ? new Date(dateTime).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '—';

  const projectIdPreview = `RFP-${new Date().getFullYear()}-AUTO`;

  return (
    <DashboardShell title="Create New RFP">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
        {/* ─── Form Side ──────────────────────────────────────────────── */}
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
                className="px-7 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors font-medium"
              >
                <Save className="w-5 h-5" /> Save Draft
              </button>
              <button
                type="button"
                className="px-7 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors font-medium"
              >
                <Eye className="w-5 h-5" /> Preview RFP
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 flex items-center gap-2.5 font-medium shadow-md hover:shadow-lg transition-all ml-auto"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Publishing...' : 'Publish RFP'}
              </button>
            </div>

            {message && (
              <p
                className={`mt-8 text-center text-lg font-medium ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            )}
          </form>
        </div>

        {/* ─── Live Preview Sidebar ───────────────────────────────────── */}
        <div className="lg:block hidden">
          <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-6 text-white">
              <h3 className="text-2xl font-semibold flex items-center gap-3">
                <Eye className="w-6 h-6" /> RFP Summary & Cost Preview
              </h3>
              <p className="text-blue-100 mt-1.5 text-sm">Review before publishing</p>
            </div>

            {/* Content */}
            <div className="p-7 space-y-7">
              {/* Title */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Project Title
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formData.title || 'Not specified'}
                </div>
              </div>

              {/* Project ID */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <span className="text-blue-600 font-bold">#</span> Project ID
                </div>
                <div className="text-base font-medium text-gray-800 font-mono">
                  {projectIdPreview}
                </div>
              </div>

              {/* Budget */}
              <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100">
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" /> Estimated Budget
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {formatBudget || '—'}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> Start Date
                  </div>
                  <div className="text-gray-900 font-medium">{formData.startDate ? formatDate(formData.startDate) : '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> End Date
                  </div>
                  <div className="text-gray-900 font-medium">{formData.endDate ? formatDate(formData.endDate) : '—'}</div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Submission Deadline
                </div>
                <div className="text-gray-900 font-medium">
                  {formData.submissionDeadline ? formatDateTime(formData.submissionDeadline) : '—'}
                </div>
              </div>

              {/* Visibility */}
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

              {/* Contact */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Contact Information
                </div>
                <div className="space-y-1.5 text-gray-900">
                  <div className="font-medium">{formData.contactPerson || '—'}</div>
                  <div className="text-gray-600 text-sm">{formData.contactEmail || '—'}</div>
                </div>
              </div>

              {/* Attachments */}
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
    </DashboardShell>
  );
}