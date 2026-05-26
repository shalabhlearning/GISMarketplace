'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Trash2, Plus, X, FileText, ArrowLeft, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Milestone { title: string; amount: string; dueDate: string }
interface CaseStudy { link: string }
interface Reference { name: string; phone: string; email: string; project: string }
interface DraftData {
  bid_amount:   string;
  technical:    string;
  delivery:     string;
  milestones:   Milestone[];
  case_studies: string[];
  references:   Reference[];
  saved_at?:    string;
}

// ── Shared input class — module-level so it's never recreated ─────────────────
const INP = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all';

// ── Section wrapper ───────────────────────────────────────────────────────────
// CRITICAL: defined at module level (outside any component).
// If defined inside a component, React sees a NEW component type on every render,
// unmounts + remounts the entire DOM subtree → focus lost, page jumps to top.
function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5 mb-5">{sub}</p>
      {children}
    </section>
  );
}

// ── Draft Preview Modal ───────────────────────────────────────────────────────
function DraftPreviewModal({ draft, onClose, onLoad }: { draft: DraftData; onClose: () => void; onLoad: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Saved Draft Preview</h3>
            {draft.saved_at && (
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last saved {new Date(draft.saved_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">Quote Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {draft.bid_amount ? `$${Number(draft.bid_amount).toLocaleString()}` : <span className="text-gray-300 text-base">Not set</span>}
            </p>
          </div>

          {draft.technical && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Technical Proposal</p>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap line-clamp-6">{draft.technical}</p>
            </div>
          )}

          {draft.milestones?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Milestones ({draft.milestones.length})</p>
              <div className="space-y-2">
                {draft.milestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-4 py-3">
                    <span className="font-medium text-gray-800">{m.title || `Milestone ${i + 1}`}</span>
                    <div className="flex items-center gap-4 text-gray-500">
                      {m.amount  && <span className="font-semibold text-gray-900">${Number(m.amount).toLocaleString()}</span>}
                      {m.dueDate && <span>{new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {draft.delivery && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Delivery Plan</p>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap line-clamp-4">{draft.delivery}</p>
            </div>
          )}

          {draft.case_studies?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">Case Studies ({draft.case_studies.filter(Boolean).length})</p>
              <div className="space-y-1.5">
                {draft.case_studies.filter(Boolean).map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:underline bg-gray-50 rounded-lg px-3 py-2 truncate">{link}</a>
                ))}
              </div>
            </div>
          )}

          {draft.references?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">References ({draft.references.length})</p>
              <div className="space-y-2">
                {draft.references.map((ref, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-0.5">
                    {ref.name    && <p><span className="font-semibold text-gray-800">Name:</span> {ref.name}</p>}
                    {ref.email   && <p><span className="font-semibold text-gray-800">Email:</span> {ref.email}</p>}
                    {ref.project && <p><span className="font-semibold text-gray-800">Project:</span> {ref.project}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button onClick={onLoad}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Load this Draft
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Form Component ───────────────────────────────────────────────────────
export default function SubmitQuoteForm({ rfp }: { rfp: any }) {
  const router = useRouter();

  const [bidAmount,    setBidAmount]    = useState('');
  const [technical,    setTechnical]    = useState('');
  const [deliveryPlan, setDeliveryPlan] = useState('');
  const [milestones,   setMilestones]   = useState<Milestone[]>([]);
  const [caseStudies,  setCaseStudies]  = useState<CaseStudy[]>([]);
  const [references,   setReferences]   = useState<Reference[]>([]);
  const [attachments,  setAttachments]  = useState<File[]>([]);

  const [loading,     setLoading]     = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [savedDraft,  setSavedDraft]  = useState<DraftData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasDraft,    setHasDraft]    = useState(false);
  const [message,     setMessage]     = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!rfp?.project_id) return;
    (async () => {
      try {
        const res = await fetch(`/api/proposal/get-draft?project_id=${rfp.project_id}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !Object.keys(data).length) return;
        const draft: DraftData = {
          bid_amount:   data.bid_amount   || '',
          technical:    data.technical    || '',
          delivery:     data.delivery     || '',
          milestones:   data.milestones   || [],
          case_studies: data.case_studies || [],
          references:   data.references   || [],
          saved_at:     data.updated_at   || data.created_at,
        };
        setHasDraft(true);
        setSavedDraft(draft);
        setBidAmount(draft.bid_amount);
        setTechnical(draft.technical);
        setDeliveryPlan(draft.delivery);
        setMilestones(draft.milestones);
        setCaseStudies(draft.case_studies.map((link: string) => ({ link })));
        setReferences(draft.references);
      } catch (err) {
        console.error('Failed to load draft', err);
      }
    })();
  }, [rfp.project_id]);

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    try {
      const payload = {
        project_id:   rfp.project_id,
        bid_amount:   bidAmount,
        technical,
        delivery:     deliveryPlan,
        milestones,
        case_studies: caseStudies.map(cs => cs.link),
        references,
      };
      const res  = await fetch('/api/proposal/save-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✓ Draft saved successfully!', type: 'success' });
        setHasDraft(true);
        setSavedDraft({ ...payload, saved_at: new Date().toISOString() });
      } else {
        setMessage({ text: data.error || 'Failed to save draft', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to save draft', type: 'error' });
    } finally {
      setDraftSaving(false);
    }
  };

  const handleLoadDraft = useCallback(() => {
    if (!savedDraft) return;
    setBidAmount(savedDraft.bid_amount || '');
    setTechnical(savedDraft.technical || '');
    setDeliveryPlan(savedDraft.delivery || '');
    setMilestones(savedDraft.milestones || []);
    setCaseStudies((savedDraft.case_studies || []).map(link => ({ link })));
    setReferences(savedDraft.references || []);
    setShowPreview(false);
    setMessage({ text: '✓ Draft loaded into form!', type: 'info' });
  }, [savedDraft]);

  const addMilestone    = () => setMilestones(p => [...p, { title: '', amount: '', dueDate: '' }]);
  const removeMilestone = (i: number) => setMilestones(p => p.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, f: keyof Milestone, v: string) =>
    setMilestones(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });

  const addCaseStudy    = () => setCaseStudies(p => [...p, { link: '' }]);
  const removeCaseStudy = (i: number) => setCaseStudies(p => p.filter((_, idx) => idx !== i));
  const updateCaseStudy = (i: number, v: string) =>
    setCaseStudies(p => { const n = [...p]; n[i] = { link: v }; return n; });

  const addReference    = () => setReferences(p => [...p, { name: '', phone: '', email: '', project: '' }]);
  const removeReference = (i: number) => setReferences(p => p.filter((_, idx) => idx !== i));
  const updateReference = (i: number, f: keyof Reference, v: string) =>
    setReferences(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(p => [...p, ...Array.from(e.target.files!)]);
  };
  const removeAttachment = (i: number) => setAttachments(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append('project_id',   rfp.project_id);
    fd.append('bid_amount',   bidAmount);
    fd.append('technical',    technical);
    fd.append('delivery',     deliveryPlan);
    fd.append('milestones',   JSON.stringify(milestones));
    fd.append('case_studies', JSON.stringify(caseStudies.map(cs => cs.link)));
    fd.append('references',   JSON.stringify(references));
    attachments.forEach(file => fd.append('proposal_attachments', file));
    try {
      const res  = await fetch('/api/proposal/create', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Quote submitted successfully!', type: 'success' });
        setTimeout(() => router.push('/provider'), 1500);
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
    <>
      {showPreview && savedDraft && (
        <DraftPreviewModal draft={savedDraft} onClose={() => setShowPreview(false)} onLoad={handleLoadDraft} />
      )}

      <div className="max-w-3xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to RFP
          </button>
          <div className="flex items-center gap-2">
            {hasDraft && savedDraft && (
              <button type="button" onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Preview Saved Draft
              </button>
            )}
            <button type="button" onClick={handleSaveDraft} disabled={draftSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors shadow-sm disabled:opacity-60">
              {draftSaving
                ? <><span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" /> Saving…</>
                : hasDraft ? 'Update Draft' : 'Save Draft'}
            </button>
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div className={`mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50   border-red-200   text-red-600'   :
                                         'bg-blue-50  border-blue-200  text-blue-700'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* RFP summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{rfp.title || 'Untitled Project'}</h1>
            {hasDraft && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" /> Draft saved
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Client</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{rfp.buyer_name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Deadline</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {rfp.submission_deadline
                  ? new Date(rfp.submission_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Budget</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Section title="Quote Details" sub="Enter the total quote amount for this proposal.">
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Quote Amount</label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number" step="0.01" required
                value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                placeholder="e.g. 25000.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all"
              />
            </div>
          </Section>

          <Section title="Technical Proposal" sub="Detail your proposed technical solution and approach.">
            <textarea
              value={technical} onChange={e => setTechnical(e.target.value)}
              rows={8} placeholder="Our technical proposal outlines a robust, scalable, and secure solution..."
              className={`${INP} resize-none`}
            />
          </Section>

          <Section title="Commercial Quote with Payment Milestones" sub="Define payment schedule based on project milestones.">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left   text-[10px] font-bold text-gray-400 uppercase tracking-wide">Milestone Title</th>
                    <th className="pb-3 text-left pl-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Amount ($)</th>
                    <th className="pb-3 text-left pl-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Due Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-2.5 pr-2">
                        <input value={m.title} onChange={e => updateMilestone(idx, 'title', e.target.value)} placeholder="Phase 1: Discovery" className={INP} />
                      </td>
                      <td className="py-2.5 px-2">
                        <input type="number" value={m.amount} onChange={e => updateMilestone(idx, 'amount', e.target.value)} placeholder="7500.00" className={INP} />
                      </td>
                      <td className="py-2.5 px-2">
                        <input type="date" value={m.dueDate} onChange={e => updateMilestone(idx, 'dueDate', e.target.value)} className={INP} />
                      </td>
                      <td className="py-2.5 pl-2">
                        <button type="button" onClick={() => removeMilestone(idx)}>
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {milestones.length === 0 && (
              <p className="text-xs text-gray-400 italic py-3 text-center">No milestones added yet.</p>
            )}
            <button type="button" onClick={addMilestone}
              className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </Section>

          <Section title="Delivery Plan" sub="Outline the project delivery phases and timeline.">
            <textarea
              value={deliveryPlan} onChange={e => setDeliveryPlan(e.target.value)}
              rows={6} placeholder={`Plan Details\n1. Discovery & Planning (Weeks 1-2): Requirements gathering...`}
              className={`${INP} resize-none`}
            />
          </Section>

          <Section title="Past Project Case Studies" sub="Provide links to relevant past projects.">
            <div className="space-y-2.5">
              {caseStudies.map((cs, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input value={cs.link} onChange={e => updateCaseStudy(idx, e.target.value)}
                    placeholder="https://example.com/casestudy" className={`${INP} flex-1`} />
                  <button type="button" onClick={() => removeCaseStudy(idx)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCaseStudy}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="w-4 h-4" /> Add Case Study Link
            </button>
          </Section>

          <Section title="Past Client References" sub="Provide details for clients who can vouch for your work.">
            <div className="space-y-4">
              {references.map((ref, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <input placeholder="Client Name"       value={ref.name}    onChange={e => updateReference(idx, 'name',    e.target.value)} className={INP} />
                  <input placeholder="Contact Phone"     value={ref.phone}   onChange={e => updateReference(idx, 'phone',   e.target.value)} className={INP} />
                  <input placeholder="Contact Email"     value={ref.email}   onChange={e => updateReference(idx, 'email',   e.target.value)} className={INP} />
                  <input placeholder="Project Worked On" value={ref.project} onChange={e => updateReference(idx, 'project', e.target.value)} className={INP} />
                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" onClick={() => removeReference(idx)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                      Remove Reference
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addReference}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="w-4 h-4" /> Add Client Reference
            </button>
          </Section>

          <Section title="Attachments" sub="Upload any supporting documents, images, or additional files.">
            <div
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) setAttachments(p => [...p, ...Array.from(e.dataTransfer.files)]); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <Upload className="w-10 h-10 mx-auto text-gray-300 group-hover:text-gray-500 transition-colors mb-3" />
              <p className="text-sm text-gray-500">
                Drag and drop files here, or <span className="font-semibold text-gray-700">click to select</span>
              </p>
              <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeAttachment(idx)}>
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Bottom actions */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-10">
            <button type="button" onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-full hover:bg-gray-50 shadow-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to RFP
            </button>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSaveDraft} disabled={draftSaving}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60">
                {draftSaving ? 'Saving…' : hasDraft ? 'Update Draft' : 'Save Draft'}
              </button>
              <button type="submit" disabled={loading}
                className="px-8 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-full shadow-sm transition-all disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit Quote'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}