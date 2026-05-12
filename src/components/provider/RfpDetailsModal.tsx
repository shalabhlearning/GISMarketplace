'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Clock, User, Mail, FileText, Upload, Brain } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface RfpDetailsModalProps {
  rfp: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function RfpDetailsModal({ rfp, isOpen, onClose }: RfpDetailsModalProps) {
  const router = useRouter();

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // 🔥 IMPORTANT: Reset state when RFP changes
  useEffect(() => {
    if (rfp) {
      setAnalysis(null);
      setShowAnalysis(false);
      setAnalyzing(false);
    }
  }, [rfp?.project_id]);   // Reset when project_id changes

  if (!isOpen || !rfp) return null;

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatDateTime = (dateTime: string | null) =>
    dateTime
      ? new Date(dateTime).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      })
      : '—';

  let attachments: string[] = [];
  if (rfp.attachments) {
    try {
      attachments = typeof rfp.attachments === 'string'
        ? JSON.parse(rfp.attachments)
        : rfp.attachments;
    } catch (e) {
      console.error('Parse error:', e);
    }
  }

  const handleSendQuote = () => {
    onClose();
    router.push(`/propose/${rfp.project_id}`);
  };

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    setShowAnalysis(false);

    try {
      const res = await fetch(`/api/rfp/${rfp.project_id}/ai-analyze`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "AI Analysis failed");
      }

      setAnalysis(data.analysis);
      setShowAnalysis(true);
      toast.success("✅ AI Analysis completed successfully!");

    } catch (err: any) {
      toast.error(err.message || "Failed to analyze RFP");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-600" />
              RFP Details
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          <div className="p-8 space-y-8 text-gray-900">
            {/* Your original UI remains unchanged */}
            <div>
              <div className="text-3xl font-bold">{rfp.title || 'Untitled'}</div>
              <div className="text-sm font-mono mt-2 text-gray-700">
                Project ID: {rfp.project_id?.toUpperCase() || '—'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="whitespace-pre-wrap leading-relaxed">
                {rfp.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" /> Budget
                </div>
                <div className="text-2xl font-bold">
                  {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Start Date
                </div>
                <div className="text-lg font-medium">{formatDate(rfp.start_date)}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> End Date
                </div>
                <div className="text-lg font-medium">{formatDate(rfp.end_date)}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Submission Deadline
                </div>
                <div className="text-lg font-medium">{formatDateTime(rfp.submission_deadline)}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-700">Contact Person</div>
                    <div className="font-medium text-gray-900">{rfp.contact_person || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-700">Contact Email</div>
                    <div className="font-medium text-gray-900">{rfp.contact_email || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" /> Attachments ({attachments.length})
                </h3>
                <div className="space-y-3">
                  {attachments.map((file: string, idx: number) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-900"
                    >
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <span className="hover:underline">
                        {file.split('/').pop() || `Attachment ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analyzer Button */}
            <div className="pt-4 border-t">
              <button
                onClick={handleAIAnalyze}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-xl transition-all disabled:opacity-70"
              >
                <Brain className="w-6 h-6" />
                {analyzing ? 'Analyzing PDF with AI...' : '🤖 AI Analyzer'}
              </button>
            </div>

            {/* AI Analysis Display */}
            {showAnalysis && analysis && (
              <div className="mt-8 border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-5 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm">
                        <Brain className="w-7 h-7" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold">
                          AI PDF Intelligence Report
                        </h3>
                        <p className="text-sm text-purple-100 mt-1">
                          Structured details extracted from uploaded RFP documents
                        </p>
                      </div>
                    </div>

                    {analysis.confidence && (
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                        <div className="text-xs uppercase tracking-wide text-purple-100">
                          Confidence Score
                        </div>

                        <div className="text-3xl font-bold">
                          {Math.round(analysis.confidence * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">

                  {/* Overview */}
                  {analysis.project_overview && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Project Overview
                        </h4>
                      </div>

                      <p className="leading-8 text-gray-700 whitespace-pre-wrap">
                        {analysis.project_overview}
                      </p>
                    </div>
                  )}

                  {/* Scope + Technical */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {analysis.scope_of_work &&
                      Array.isArray(analysis.scope_of_work) && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-5">
                            Scope of Work
                          </h4>

                          <div className="space-y-3">
                            {analysis.scope_of_work.map(
                              (item: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex gap-3 items-start bg-gray-50 rounded-xl p-4"
                                >
                                  <div className="min-w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-semibold">
                                    {i + 1}
                                  </div>

                                  <p className="text-gray-700 leading-7">
                                    {item}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {analysis.technical_requirements &&
                      Array.isArray(analysis.technical_requirements) && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-5">
                            Technical Requirements
                          </h4>

                          <div className="space-y-3">
                            {analysis.technical_requirements.map(
                              (item: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex gap-3 items-start bg-indigo-50 rounded-xl p-4"
                                >
                                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-3"></div>

                                  <p className="text-gray-700 leading-7">
                                    {item}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Budget + Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {analysis.budget_info && (
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="relative">
                          <div className="text-sm uppercase tracking-wide text-green-100 mb-2">
                            Budget Insights
                          </div>

                          <div className="text-2xl font-bold leading-relaxed">
                            {typeof analysis.budget_info === 'object'
                              ? analysis.budget_info.budget_range ||
                              JSON.stringify(analysis.budget_info)
                              : analysis.budget_info}
                          </div>
                        </div>
                      </div>
                    )}

                    {analysis.timeline && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-5">
                          Timeline Analysis
                        </h4>

                        <div className="space-y-4">

                          <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-gray-600">Start Date</span>
                            <span className="font-semibold text-gray-900">
                              {analysis.timeline.start_date || '-'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-gray-600">End Date</span>
                            <span className="font-semibold text-gray-900">
                              {analysis.timeline.end_date || '-'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Estimated Duration</span>
                            <span className="font-semibold text-blue-700">
                              {analysis.timeline.duration || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deliverables */}
                  {analysis.deliverables &&
                    Array.isArray(analysis.deliverables) && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-5">
                          Expected Deliverables
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analysis.deliverables.map(
                            (item: string, i: number) => (
                              <div
                                key={i}
                                className="flex gap-3 items-start border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                  ✓
                                </div>

                                <p className="text-gray-700 leading-7">
                                  {item}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Evaluation Criteria */}
                  {analysis.evaluation_criteria &&
                    Array.isArray(analysis.evaluation_criteria) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-amber-900 mb-4">
                          Evaluation Criteria
                        </h4>

                        <div className="flex flex-wrap gap-3">
                          {analysis.evaluation_criteria.map(
                            (item: string, i: number) => (
                              <div
                                key={i}
                                className="px-4 py-2 rounded-full bg-white border border-amber-200 text-amber-800 text-sm font-medium"
                              >
                                {item}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Risks */}
                  {analysis.risks_constraints &&
                    Array.isArray(analysis.risks_constraints) && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-red-900 mb-4">
                          Risks & Constraints
                        </h4>

                        <div className="space-y-3">
                          {analysis.risks_constraints.map(
                            (item: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 bg-white rounded-xl p-4 border border-red-100"
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-3"></div>

                                <p className="text-gray-700 leading-7">
                                  {item}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Contact */}
                  {analysis.key_contact && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Extracted Contact Information
                      </h4>

                      <div className="bg-white rounded-xl border border-gray-200 p-5 text-gray-700 leading-7">
                        {typeof analysis.key_contact === 'object'
                          ? JSON.stringify(analysis.key_contact, null, 2)
                          : analysis.key_contact}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300">
                Close
              </button>
              <button onClick={handleSendQuote} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                Send Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </>
  );
}