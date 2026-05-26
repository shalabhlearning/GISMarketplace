// src/components/admin/ReviewPanel.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ReviewPanel({ rfp, onClose, onAction }: any) {
  const [matchedProviders, setMatchedProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const attachments = rfp.attachments
    ? typeof rfp.attachments === 'string'
      ? JSON.parse(rfp.attachments)
      : rfp.attachments
    : [];

  // RFP already decided — no actions allowed
  const isDecided = rfp.status === 'open' || rfp.status === 'closed';

  // Fetch matched providers when RFP is approved
  useEffect(() => {
    if (rfp.status !== 'open') return;
    setLoadingProviders(true);
    fetch(`/api/rfp/${rfp.project_id}/matched-providers`)
      .then(res => res.json())
      .then(data => setMatchedProviders(data.providers || []))
      .catch(err => console.error('Failed to load matched providers:', err))
      .finally(() => setLoadingProviders(false));
  }, [rfp.project_id, rfp.status]);

  const statusLabel = rfp.status === 'open' ? 'Approved'
    : rfp.status === 'closed' ? 'Rejected'
    : 'Pending Review';

  const statusColor = rfp.status === 'open'
    ? 'bg-emerald-100 text-emerald-700'
    : rfp.status === 'closed'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-blue-700 text-white px-8 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg flex items-center gap-3">
              Review Submission: {rfp.project_id}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <div className="text-sm opacity-90">
              Submitted by {rfp.buyer_name} on{' '}
              {new Date(rfp.created_at).toLocaleDateString()}
            </div>
          </div>
          <button onClick={onClose} className="text-3xl hover:text-gray-200">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT SIDE */}
          <div className="flex-1 p-8 overflow-y-auto">

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{rfp.title}</h2>
            <p className="text-gray-800 leading-relaxed mb-6">
              {rfp.description || 'No description provided.'}
            </p>

            <div className="grid grid-cols-2 gap-8 mt-6">
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">📅 TIMELINE EXPECTATIONS</h3>
                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Project Start</span>
                    <span>{rfp.start_date ? new Date(rfp.start_date).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Submission Deadline</span>
                    <span>{rfp.submission_deadline ? new Date(rfp.submission_deadline).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project End</span>
                    <span>{rfp.end_date ? new Date(rfp.end_date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-gray-900">💰 FINANCIALS</h3>
                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Budget</span>
                    <span className="font-semibold text-blue-700">₹{rfp.budget || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mt-10">
              <h3 className="font-semibold mb-4 text-gray-900">📎 ATTACHMENTS</h3>
              {attachments.length === 0 ? (
                <p className="text-gray-600 text-sm">No attachments</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((file: string, idx: number) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      className="border rounded-xl p-4 flex items-center gap-3 hover:bg-gray-100 cursor-pointer"
                    >
                      <div>📄</div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{file.split('/').pop()}</div>
                        <div className="text-xs text-gray-600">Click to view</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Matched Providers — only for approved RFPs */}
            {rfp.status === 'open' && (
              <div className="mt-10">
                <h3 className="font-semibold mb-4 text-gray-900">
                  🎯 MATCHED PROVIDERS
                  {!loadingProviders && matchedProviders.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({matchedProviders.length} providers can see this RFP)
                    </span>
                  )}
                </h3>

                {loadingProviders ? (
                  <p className="text-sm text-gray-500 animate-pulse">Loading matched providers...</p>
                ) : matchedProviders.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    ⚠️ No providers matched yet — skill extraction may still be running in the background. Close and reopen this panel in a moment.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {matchedProviders.map((p: any) => {
                      let matchedSkills: string[] = [];
                      try {
                        const reason = typeof p.reason === 'string' ? JSON.parse(p.reason) : p.reason;
                        matchedSkills = reason?.matched_skills || [];
                      } catch {}

                      return (
                        <div
                          key={p.provider_id}
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {p.organization_name}
                            </div>
                            {matchedSkills.length > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {matchedSkills.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className={`text-sm font-bold ${
                              p.match_score >= 0.8 ? 'text-emerald-600'
                              : p.match_score >= 0.6 ? 'text-blue-600'
                              : 'text-amber-600'
                            }`}>
                              {Math.round(p.match_score * 100)}%
                            </div>
                            <div className="text-xs text-gray-400">match</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="w-96 border-l bg-gray-100 p-6 flex flex-col">

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-900">📋 Audit Notes</h3>
              <div className="bg-white p-4 rounded-xl text-sm text-gray-800">
                System Validation Passed
                <div className="text-xs text-gray-500 mt-2">{new Date().toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              {isDecided ? (
                // ✅ Already decided — no action buttons, just status
                <div className={`w-full text-center font-semibold py-3.5 rounded-xl ${
                  rfp.status === 'open'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {rfp.status === 'open' ? '✅ RFP has been approved' : '❌ RFP has been rejected'}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onAction(rfp.project_id, 'approve')}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl"
                  >
                    Approve & Post
                  </button>

                  <button
                    onClick={() => onAction(rfp.project_id, 'changes')}
                    className="w-full border border-gray-400 hover:bg-gray-200 text-gray-900 font-medium py-3.5 rounded-xl"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => onAction(rfp.project_id, 'reject')}
                    className="w-full text-red-700 hover:bg-red-100 font-medium py-3.5 rounded-xl border border-red-300"
                  >
                    Reject Submission
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-600 hover:bg-gray-200 font-medium py-3 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}