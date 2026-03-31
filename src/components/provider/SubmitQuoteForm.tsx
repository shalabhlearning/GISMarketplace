'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Plus, X, Paperclip, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubmitQuoteForm({ rfp }: { rfp: any }) {
  const router = useRouter();

  const [bidAmount, setBidAmount] = useState('');
  const [technical, setTechnical] = useState('');
  const [deliveryPlan, setDeliveryPlan] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; amount: string; dueDate: string }[]>([]);
  const [caseStudies, setCaseStudies] = useState<{ link: string }[]>([]);
  const [references, setReferences] = useState<{ name: string; phone: string; email: string; project: string }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft when component mounts
  useEffect(() => {
    if (!rfp?.project_id) return;

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/proposal/get-draft?project_id=${rfp.project_id}`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setBidAmount(data.bid_amount || '');
            setTechnical(data.technical || '');
            setDeliveryPlan(data.delivery || '');
            setMilestones(data.milestones || []);
            setCaseStudies((data.case_studies || []).map((link: string) => ({ link })));
            setReferences(data.references || []);
          }
        }
      } catch (err) {
        console.error("Failed to load draft", err);
      }
    };

    loadDraft();
  }, [rfp.project_id]);

  const handleSaveDraft = async () => {
    try {
      const res = await fetch('/api/proposal/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: rfp.project_id,
          bid_amount: bidAmount,
          technical,
          delivery: deliveryPlan,
          milestones,
          case_studies: caseStudies.map(cs => cs.link),
          references
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to save draft', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to save draft', type: 'error' });
    }
  };

  const addMilestone = () => setMilestones([...milestones, { title: '', amount: '', dueDate: '' }]);
  const removeMilestone = (idx: number) => setMilestones(milestones.filter((_, i) => i !== idx));
  const updateMilestone = (idx: number, field: keyof typeof milestones[0], value: string) => {
    const newM = [...milestones];
    newM[idx][field] = value;
    setMilestones(newM);
  };

  const addCaseStudy = () => setCaseStudies([...caseStudies, { link: '' }]);
  const removeCaseStudy = (idx: number) => setCaseStudies(caseStudies.filter((_, i) => i !== idx));
  const updateCaseStudy = (idx: number, value: string) => {
    const newCs = [...caseStudies];
    newCs[idx].link = value;
    setCaseStudies(newCs);
  };

  const addReference = () => setReferences([...references, { name: '', phone: '', email: '', project: '' }]);
  const removeReference = (idx: number) => setReferences(references.filter((_, i) => i !== idx));
  const updateReference = (idx: number, field: keyof typeof references[0], value: string) => {
    const newR = [...references];
    newR[idx][field] = value;
    setReferences(newR);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

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
        setTimeout(() => router.push('/provider'), 1500);
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to submit quote', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {rfp.title || 'Untitled Project'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-600">Client</span>
            <p className="font-medium text-gray-900">
              {rfp.buyer_name || 'Acme Corp.'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Deadline</span>
            <p className="font-medium text-gray-900">
              {rfp.submission_deadline
                ? new Date(rfp.submission_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quote Details */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Quote Details</h2>
          <p className="text-sm text-gray-600 mb-3">Enter the total quote amount for this proposal.</p>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quote Amount</label>
          <div className="relative max-w-md">
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              required
              placeholder="e.g. 25000.00"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
            />
          </div>
        </section>

        {/* Technical Proposal */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Technical Proposal</h2>
          <p className="text-sm text-gray-600 mb-3">Detail your proposed technical solution and approach.</p>
          <textarea
            value={technical}
            onChange={e => setTechnical(e.target.value)}
            rows={8}
            placeholder="Our technical proposal outlines a robust, scalable, and secure solution..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-blue-500 text-gray-900"
          />
        </section>

        {/* Commercial Quote with Payment Milestones */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Commercial Quote with Payment Milestones</h2>
          <p className="text-sm text-gray-600 mb-4">Define payment schedule based on project milestones.</p>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-700 border-b">
                <th className="pb-3">Milestone Title</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-3">
                    <input
                      value={m.title}
                      onChange={e => updateMilestone(idx, 'title', e.target.value)}
                      placeholder="Phase 1: Discovery & Planning"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={m.amount}
                      onChange={e => updateMilestone(idx, 'amount', e.target.value)}
                      placeholder="7500.00"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="date"
                      value={m.dueDate}
                      onChange={e => updateMilestone(idx, 'dueDate', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <button type="button" onClick={() => removeMilestone(idx)} className="text-red-600 hover:text-red-800">
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addMilestone}
            className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" /> Add Milestone
          </button>
        </section>

        {/* Delivery Plan */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Delivery Plan</h2>
          <p className="text-sm text-gray-600 mb-3">Outline the project delivery phases and timeline.</p>
          <textarea
            value={deliveryPlan}
            onChange={e => setDeliveryPlan(e.target.value)}
            rows={6}
            placeholder="Plan Details
1. Discovery & Planning (Weeks 1-2): Requirements gathering..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-blue-500 text-gray-900"
          />
        </section>

        {/* Past Project Case Studies */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Past Project Case Studies</h2>
          <p className="text-sm text-gray-600 mb-3">Provide links to relevant past projects.</p>
          {caseStudies.map((cs, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-3">
              <input
                value={cs.link}
                onChange={e => updateCaseStudy(idx, e.target.value)}
                placeholder="https://example.com/casestudy"
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
              />
              <button type="button" onClick={() => removeCaseStudy(idx)} className="text-red-600 hover:text-red-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCaseStudy}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" /> Add Case Study Link
          </button>
        </section>

        {/* Past Client References */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Past Client References</h2>
          <p className="text-sm text-gray-600 mb-3">Provide details for clients who can vouch for your work.</p>
          {references.map((ref, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 rounded-lg">
              <input
                placeholder="Client Name"
                value={ref.name}
                onChange={e => updateReference(idx, 'name', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
              />
              <input
                placeholder="Contact Phone"
                value={ref.phone}
                onChange={e => updateReference(idx, 'phone', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
              />
              <input
                placeholder="Contact Email"
                value={ref.email}
                onChange={e => updateReference(idx, 'email', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
              />
              <input
                placeholder="Project Worked On"
                value={ref.project}
                onChange={e => updateReference(idx, 'project', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
              />
              <button
                type="button"
                onClick={() => removeReference(idx)}
                className="md:col-span-2 text-red-600 hover:text-red-800 text-right font-medium"
              >
                Remove Reference
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addReference}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" /> Add Client Reference
          </button>
        </section>

        {/* Attachments */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Attachments</h2>
          <p className="text-sm text-gray-600 mb-3">Upload any supporting documents, images, or additional files.</p>
          <div
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) setAttachments([...attachments, ...Array.from(e.dataTransfer.files)]);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 cursor-pointer transition-colors"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-900 font-medium">Drag and drop files here, or click to select</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </div>

          {attachments.length > 0 && (
            <div className="mt-6 space-y-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-8">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Save Draft
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Quote'}
          </button>
        </div>

        {message && (
          <p className={`text-center text-lg font-medium mt-6 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}