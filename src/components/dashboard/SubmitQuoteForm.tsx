// src/components/dashboard/SubmitQuoteForm.tsx (Updated: Darker text colors + removed credits section)
'use client';

import { useState, useRef } from 'react';
import { Upload, Trash2, Plus, X } from 'lucide-react';

interface Milestone {
  title: string;
  amount: string;
  dueDate: string;
}

interface Reference {
  name: string;
  phone: string;
  email: string;
  project: string;
}

interface CaseStudy {
  link: string;
}

export default function SubmitQuoteForm({ rfp }: { rfp: any }) {
  const [bidAmount, setBidAmount] = useState('');
  const [technical, setTechnical] = useState('');
  const [deliveryPlan, setDeliveryPlan] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMilestone = () => setMilestones([...milestones, { title: '', amount: '', dueDate: '' }]);
  const removeMilestone = (idx: number) => setMilestones(milestones.filter((_, i) => i !== idx));
  const updateMilestone = (idx: number, field: keyof Milestone, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[idx][field] = value;
    setMilestones(newMilestones);
  };

  const addCaseStudy = () => setCaseStudies([...caseStudies, { link: '' }]);
  const removeCaseStudy = (idx: number) => setCaseStudies(caseStudies.filter((_, i) => i !== idx));

  const addReference = () => setReferences([...references, { name: '', phone: '', email: '', project: '' }]);
  const removeReference = (idx: number) => setReferences(references.filter((_, i) => i !== idx));
  const updateReference = (idx: number, field: keyof Reference, value: string) => {
    const newRefs = [...references];
    newRefs[idx][field] = value;
    setReferences(newRefs);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) setAttachments([...attachments, ...Array.from(files)]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const fd = new FormData();
    fd.append('project_id', rfp.project_id);
    fd.append('bid_amount', bidAmount);
    fd.append('technical', technical);
    fd.append('delivery', deliveryPlan);
    fd.append('milestones', JSON.stringify(milestones));
    fd.append('case_studies', JSON.stringify(caseStudies.map(cs => cs.link)));
    fd.append('references', JSON.stringify(references));
    attachments.forEach(file => fd.append('proposal_attachments', file));

    try {
      const res = await fetch('/api/proposal/create', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Quote submitted successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to submit quote', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Proposal for "{rfp.title}"</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-900 font-medium">Client</span>
            <p className="font-semibold text-gray-900">{rfp.buyer_name || 'Unknown'}</p>
          </div>
          <div>
            <span className="text-gray-900 font-medium">Deadline</span>
            <p className="font-semibold text-gray-900">
              {rfp.submission_deadline ? new Date(rfp.submission_deadline).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Quote Details */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quote Details</h2>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Quote Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            required
            placeholder="e.g. 25000.00"
            className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
          />
        </section>

        {/* Technical Proposal */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Technical Proposal</h2>
          <textarea
            value={technical}
            onChange={e => setTechnical(e.target.value)}
            rows={10}
            placeholder="Detail your proposed technical solution and approach..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none text-gray-900"
          />
        </section>

        {/* Milestones */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Commercial Quote with Payment Milestones</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-900">
                <th className="pb-4">Milestone Title</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, idx) => (
                <tr key={idx}>
                  <td className="py-2">
                    <input
                      value={m.title}
                      onChange={e => updateMilestone(idx, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={m.amount}
                      onChange={e => updateMilestone(idx, 'amount', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="date"
                      value={m.dueDate}
                      onChange={e => updateMilestone(idx, 'dueDate', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <button type="button" onClick={() => removeMilestone(idx)} className="text-red-600">
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addMilestone} className="mt-4 text-blue-600 flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" /> Add Milestone
          </button>
        </section>

        {/* Delivery Plan */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Plan</h2>
          <textarea
            value={deliveryPlan}
            onChange={e => setDeliveryPlan(e.target.value)}
            rows={8}
            placeholder="Outline the project delivery phases and timeline..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none text-gray-900"
          />
        </section>

        {/* Case Studies */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Project Case Studies</h2>
          {caseStudies.map((cs, idx) => (
            <div key={idx} className="flex items-center gap-4 mb-3">
              <input
                value={cs.link}
                onChange={e => {
                  const newCs = [...caseStudies];
                  newCs[idx].link = e.target.value;
                  setCaseStudies(newCs);
                }}
                placeholder="https://example.com/casestudy"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
              <button type="button" onClick={() => removeCaseStudy(idx)} className="text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addCaseStudy} className="mt-4 text-blue-600 flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" /> Add Case Study Link
          </button>
        </section>

        {/* References */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Client References</h2>
          {references.map((ref, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 rounded-xl">
              <input placeholder="Client Name" value={ref.name} onChange={e => updateReference(idx, 'name', e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-900" />
              <input placeholder="Contact Phone" value={ref.phone} onChange={e => updateReference(idx, 'phone', e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-900" />
              <input placeholder="Contact Email" value={ref.email} onChange={e => updateReference(idx, 'email', e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-900" />
              <input placeholder="Project Worked On" value={ref.project} onChange={e => updateReference(idx, 'project', e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-900" />
              <button type="button" onClick={() => removeReference(idx)} className="md:col-span-2 text-red-600 text-right font-medium">
                Remove Reference
              </button>
            </div>
          ))}
          <button type="button" onClick={addReference} className="mt-4 text-blue-600 flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" /> Add Client Reference
          </button>
        </section>

        {/* Attachments */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Attachments</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-blue-500 transition-all cursor-pointer"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-900 font-medium">Drag & drop files here or click to browse</p>
            <input ref={fileInputRef} type="file" multiple hidden onChange={e => handleFileChange(e.target.files)} />
          </div>

          {attachments.length > 0 && (
            <div className="mt-6 space-y-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3">
                  <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button type="button" className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 font-medium">
            Save Draft
          </button>
          <button type="button" className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 font-medium">
            Preview Quote
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Quote'}
          </button>
        </div>

        {message && (
          <p className={`text-center text-lg font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}