'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ArrowLeft, Bookmark, Brain, Calendar, ChevronRight,
  Clock, FileText, Mail, Upload, User, Coins, Zap,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RfpDetailPage() {
  const params     = useParams();
  const router     = useRouter();
  const project_id = params.project_id as string;

  const [rfp,          setRfp]          = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analysis,     setAnalysis]     = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (!project_id) return;
    setLoading(true);
    fetch(`/api/rfp/${project_id}`, { credentials: 'include' })
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'RFP not found.' : `Error ${r.status}`);
        const d = await r.json();
        setRfp(d.rfp || d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [project_id]);

  const fmt  = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtT = (d: string | null) =>
    d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

  let attachments: string[] = [];
  if (rfp?.attachments) {
    try {
      attachments = typeof rfp.attachments === 'string'
        ? JSON.parse(rfp.attachments)
        : Array.isArray(rfp.attachments) ? rfp.attachments : [];
    } catch {}
  }

  let skills: string[] = [];
  if (rfp?.skills) {
    try { skills = typeof rfp.skills === 'string' ? JSON.parse(rfp.skills) : rfp.skills; } catch {}
  }

  const handleAIAnalyze = async () => {
    setAnalyzing(true); setAnalysis(null); setShowAnalysis(false);
    try {
      const res  = await fetch(`/api/rfp/${project_id}/ai-analyze`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Analysis failed');
      setAnalysis(data.analysis);
      setShowAnalysis(true);
      toast.success('AI Analysis complete!');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setAnalyzing(false); }
  };

  // ── Safe renderer for any analysis field that might be an object ──────────
  const renderAnalysisValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    // Handle {min, max} budget objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('min' in value && 'max' in value) {
        const min = value.min != null ? `$${Number(value.min).toLocaleString()}` : null;
        const max = value.max != null ? `$${Number(value.max).toLocaleString()}` : null;
        if (min && max) return `${min} – ${max}`;
        if (min) return `From ${min}`;
        if (max) return `Up to ${max}`;
      }
      if ('budget_range' in value) return String(value.budget_range);
      // Generic fallback: join key-value pairs
      return Object.entries(value)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return JSON.stringify(value);
  };

  // ── Loading ──
  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardShell>
  );

  // ── Error ──
  if (error || !rfp) return (
    <DashboardShell>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Job Bidding
      </button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <p className="text-gray-500">{error || 'RFP not found or inaccessible.'}</p>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      <Toaster position="top-center" />

      {/* ── Back button ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Job Bidding
      </button>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT: RFP content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{rfp.title || 'Untitled'}</h1>
                  <p className="text-[12px] text-gray-400 mt-1">
                    Posted{' '}
                    {rfp.created_at
                      ? new Date(rfp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : '—'}
                    {rfp.buyer_name && (
                      <> by <span className="text-gray-600 font-medium">{rfp.buyer_name}</span></>
                    )}
                    {' · '}Job ID:{' '}
                    <span className="font-mono">#{rfp.project_id?.slice(0, 8).toUpperCase()}</span>
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 shrink-0 transition-colors">
                <Bookmark className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Meta pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Budget Range',  value: rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable' },
                { label: 'Timeline',      value: '4–6 Weeks' },
                { label: 'Experience',    value: 'Expert' },
                { label: 'Project Type',  value: 'One-time' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#eef7f0] rounded-xl px-4 py-3">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Project Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {rfp.description || 'No description provided.'}
            </p>
          </div>

          {/* Requirements */}
          {rfp.requirements && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Mandatory Requirements</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{rfp.requirements}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline & Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Timeline & Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Start Date',          value: fmt(rfp.start_date) },
                { icon: Calendar, label: 'End Date',            value: fmt(rfp.end_date) },
                { icon: Clock,    label: 'Submission Deadline', value: fmtT(rfp.submission_deadline) },
                { icon: User,     label: 'Contact Person',      value: rfp.contact_person || '—' },
                { icon: Mail,     label: 'Contact Email',       value: rfp.contact_email  || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{label}</p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Client Attachments ({attachments.length})
              </h2>
              <div className="space-y-2 mb-4">
                {attachments.map((file: string, idx: number) => (
                  <a
                    key={idx}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">
                        {decodeURIComponent(file.split('/').pop() || `Attachment ${idx + 1}`)}
                      </p>
                      <p className="text-[10px] text-gray-400">PDF</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* AI Analyze button */}
              <button
                onClick={handleAIAnalyze}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <Brain className="w-4 h-4 text-purple-600" />
                {analyzing ? 'Analyzing PDF with AI…' : '✦ Get Documment Summary with AI'}
              </button>
            </div>
          )}

          {/* AI Analysis Result */}
          {showAnalysis && analysis && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-5 text-white flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-base">AI PDF Intelligence Report</p>
                    <p className="text-xs text-purple-100 mt-0.5">Structured analysis from uploaded documents</p>
                  </div>
                </div>
                {analysis.confidence && (
                  <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-[9px] uppercase tracking-wide text-purple-200">Confidence</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                {analysis.project_overview && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">Project Overview</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{renderAnalysisValue(analysis.project_overview)}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.scope_of_work?.length > 0 && (
                    <div className="border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-700 mb-3">Scope of Work</p>
                      <div className="space-y-2">
                        {analysis.scope_of_work.map((item: any, i: number) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-xs text-gray-600 leading-relaxed">{renderAnalysisValue(item)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.technical_requirements?.length > 0 && (
                    <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-700 mb-3">Technical Requirements</p>
                      <div className="space-y-2">
                        {analysis.technical_requirements.map((item: any, i: number) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <p className="text-xs text-gray-600 leading-relaxed">{renderAnalysisValue(item)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {analysis.deliverables?.length > 0 && (
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-700 mb-3">Deliverables</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {analysis.deliverables.map((item: any, i: number) => (
                        <div key={i} className="flex gap-2 items-start border border-gray-100 rounded-lg p-2.5">
                          <span className="text-green-500 font-bold text-sm shrink-0">✓</span>
                          <p className="text-xs text-gray-600 leading-relaxed">{renderAnalysisValue(item)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Budget — safely renders {min,max} objects ── */}
                {analysis.budget_info && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white p-5">
                    <p className="text-xs uppercase tracking-wide text-green-100 mb-1">Budget Insights</p>
                    <p className="text-lg font-bold leading-relaxed">
                      {renderAnalysisValue(analysis.budget_info)}
                    </p>
                  </div>
                )}

                {analysis.timeline && (
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-700 mb-3">Timeline Analysis</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Start Date', value: renderAnalysisValue(analysis.timeline.start_date) },
                        { label: 'End Date',   value: renderAnalysisValue(analysis.timeline.end_date) },
                        { label: 'Duration',   value: renderAnalysisValue(analysis.timeline.duration) },
                      ].map(({ label, value }) => value && value !== '—' && (
                        <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.evaluation_criteria?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-800 mb-2">Evaluation Criteria</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.evaluation_criteria.map((item: any, i: number) => (
                        <span key={i} className="px-3 py-1 bg-white border border-amber-200 text-amber-700 text-xs rounded-full font-medium">
                          {renderAnalysisValue(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.risks_constraints?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-700 mb-2">Risks & Constraints</p>
                    <div className="space-y-2">
                      {analysis.risks_constraints.map((item: any, i: number) => (
                        <div key={i} className="flex gap-2 items-start bg-white rounded-lg p-2.5 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{renderAnalysisValue(item)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.key_contact && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">Extracted Contact</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {renderAnalysisValue(analysis.key_contact)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Simplified CTA sidebar ── */}
        <div className="w-[260px] shrink-0 sticky top-[70px]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Cost info */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Submit a Quote</h2>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Review the RFP carefully, then proceed to craft your detailed proposal.
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#eef7f0] rounded-xl px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Budget</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Open'}
                  </p>
                </div>
                <div className="bg-[#eef7f0] rounded-xl px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Deadline</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {rfp.submission_deadline
                      ? new Date(rfp.submission_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              {/* What's included hint */}
              <div className="border border-gray-100 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Your proposal will include</p>
                {['Quote amount & milestones', 'Technical proposal', 'Delivery plan', 'Case studies & references'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <p className="text-[11px] text-gray-500">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="px-5 pb-5">
              <button
                onClick={() => router.push(`/propose/${project_id}`)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group"
              >
                Proceed for Quote Submission
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-2.5">
                You can save a draft and return later
              </p>
            </div>
          </div>

          {/* AI Analyze shortcut (only when no attachments shown above) */}
          {attachments.length === 0 && (
            <button
              onClick={handleAIAnalyze}
              disabled={analyzing}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              {analyzing ? 'Analyzing…' : 'Get Documment Summary with AI'}
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}