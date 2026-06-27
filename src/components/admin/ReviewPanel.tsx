// src/components/admin/ReviewPanel.tsx
'use client';

import { useEffect, useState } from 'react';

// ─── Safe value renderer — handles string | number | object | array ───────────
function renderValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(renderValue).join(', ');
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${renderValue(v)}`)
      .join(' • ');
  }
  return String(val);
}

// ─── Zero-match diagnostic banner ─────────────────────────────────────────────
function ZeroMatchBanner({
  skillSource,
  skillsMissing,
  onShowAll,
}: {
  skillSource?: string;
  skillsMissing?: boolean;
  onShowAll: () => void;
}) {
  const ShowAllButton = () => (
    <label className="inline-flex items-center gap-2 mt-3 cursor-pointer select-none">
      <input
        type="checkbox"
        className="w-4 h-4 accent-blue-600"
        onChange={onShowAll}
      />
      <span className="text-sm font-medium">Show all providers (0% match)</span>
    </label>
  );

  if (skillsMissing) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
        <div className="font-semibold">⚠️ No skills could be extracted for this RFP</div>
        <div className="text-red-700">
          AI analysis failed and no GIS-related keywords were found in the title or description.
          If this is a GIS project, check that the attached PDF is machine-readable.
        </div>
        <ShowAllButton />
      </div>
    );
  }

  if (skillSource === 'keyword_synthesised') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <div className="font-semibold">⚠️ No providers matched (keyword-based skills used)</div>
        <div>
          Skills were derived from the RFP title and description. If this looks wrong,
          re-upload a machine-readable PDF and reopen this panel to trigger a fresh analysis.
        </div>
        <ShowAllButton />
      </div>
    );
  }

  if (skillSource === 'ai_extracted') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <div className="font-semibold">ℹ️ Skills just extracted — no providers matched yet</div>
        <div>
          AI extracted skills from the PDF on this page-open. No providers currently match
          those skills. New providers with matching skills will appear here automatically.
        </div>
        <ShowAllButton />
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
      <div>
        ⚠️ No providers matched this RFP's required skills. New providers with matching
        skills will appear here automatically when they register.
      </div>
      <ShowAllButton />
    </div>
  );
}

// ─── Inline AI Summary Panel ───────────────────────────────────────────────────
function AiSummaryInline({
  analysis,
  loading,
  error,
}: {
  analysis: any;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="mb-6 border border-indigo-200 bg-indigo-50 rounded-xl p-5 flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
        <div>
          <div className="font-semibold text-indigo-900 text-sm">Generating AI summary…</div>
          <div className="text-xs text-indigo-600">Analyzing attached PDF(s) with RAG</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">
        ⚠️ AI summary failed: {error}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="mb-6 border border-indigo-200 bg-indigo-50/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="font-semibold text-indigo-900 text-sm">AI Summary</h3>
        <span className="text-xs text-indigo-500">RAG analysis of attached PDF(s)</span>
      </div>

      {analysis.project_overview && (
        <p className="text-sm text-gray-800 leading-relaxed mb-3">
          {renderValue(analysis.project_overview)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {analysis.scope_of_work?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-indigo-700 mb-1">SCOPE OF WORK</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {analysis.scope_of_work.slice(0, 4).map((item: any, i: number) => (
                <li key={i}>{renderValue(item)}</li>
              ))}
            </ul>
          </div>
        )}
        {analysis.deliverables?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-indigo-700 mb-1">DELIVERABLES</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {analysis.deliverables.slice(0, 4).map((item: any, i: number) => (
                <li key={i}>{renderValue(item)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.budget_info && (
        <div className="mt-3 text-sm">
          <span className="text-xs font-semibold text-indigo-700">BUDGET: </span>
          <span className="text-gray-700">{renderValue(analysis.budget_info)}</span>
        </div>
      )}

      {analysis.timeline &&
        (analysis.timeline.start_date ||
          analysis.timeline.end_date ||
          analysis.timeline.duration) && (
          <div className="mt-3 text-sm flex gap-4">
            {analysis.timeline.start_date && (
              <span>
                <span className="text-xs font-semibold text-indigo-700">START: </span>
                {renderValue(analysis.timeline.start_date)}
              </span>
            )}
            {analysis.timeline.end_date && (
              <span>
                <span className="text-xs font-semibold text-indigo-700">END: </span>
                {renderValue(analysis.timeline.end_date)}
              </span>
            )}
            {analysis.timeline.duration && (
              <span>
                <span className="text-xs font-semibold text-indigo-700">DURATION: </span>
                {renderValue(analysis.timeline.duration)}
              </span>
            )}
          </div>
        )}

      {analysis.technical_requirements?.length > 0 && (
        <div className="mt-3 text-sm">
          <div className="text-xs font-semibold text-indigo-700 mb-1">TECHNICAL REQUIREMENTS</div>
          <ul className="list-disc list-inside text-gray-700 space-y-0.5">
            {analysis.technical_requirements.slice(0, 4).map((item: any, i: number) => (
              <li key={i}>{renderValue(item)}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.confidence !== undefined && (
        <div className="mt-3 pt-2 border-t border-indigo-100 text-xs text-indigo-400 text-right">
          AI confidence: {Math.round(analysis.confidence * 100)}%
        </div>
      )}
    </div>
  );
}

// ─── Main ReviewPanel ──────────────────────────────────────────────────────────
export default function ReviewPanel({ rfp, onClose, onAction }: any) {
  const [matchedProviders, setMatchedProviders] = useState<any[]>([]);
  const [allProviders, setAllProviders] = useState<any[]>([]);   // full list returned when 0 matches
  const [showAllProviders, setShowAllProviders] = useState(false);       // toggled by "show all" checkbox
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Search query for filtering the provider list
  const [providerSearch, setProviderSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingChecklist, setSendingChecklist] = useState(false);
  const [checklistMsg, setChecklistMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [matchMeta, setMatchMeta] = useState<{
    skill_source?: string;
    skills_missing?: boolean;
    match_status?: string;
  }>({});

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const attachments: string[] = rfp.attachments
    ? typeof rfp.attachments === 'string'
      ? JSON.parse(rfp.attachments)
      : rfp.attachments
    : [];

  const hasAttachments = attachments.some(
    (a) => typeof a === 'string' && (
      a.toLowerCase().endsWith('.pdf') ||
      a.toLowerCase().endsWith('.docx') ||
      a.toLowerCase().endsWith('.doc')
    )
  );

  const isDecided = rfp.status === 'open' || rfp.status === 'closed';

  // ── Auto-run AI summary ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAttachments) return;

    if (rfp.ai_summary) {
      try {
        const parsed =
          typeof rfp.ai_summary === 'string'
            ? JSON.parse(rfp.ai_summary)
            : rfp.ai_summary;
        setAiAnalysis(parsed);
        return;
      } catch {
        // fall through
      }
    }

    let cancelled = false;
    setAiLoading(true);
    setAiError('');

    fetch(`/api/rfp/${rfp.project_id}/ai-analyze`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Analysis failed');
        if (!cancelled) setAiAnalysis(data.analysis);
      })
      .catch((err) => {
        if (!cancelled) setAiError(err.message || 'AI analysis failed');
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfp.project_id]);

  // ── Fetch matched providers ────────────────────────────────────────────────
  const fetchChecklist = () => {
    if (rfp.status !== 'open') return;
    setLoadingProviders(true);
    setMatchMeta({});
    setShowAllProviders(false);   // reset toggle on every fresh fetch
    setProviderSearch('');        // reset search too

    fetch(`/api/admin/rfp/${rfp.project_id}/checklist`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const providers = data.providers || [];
        setMatchedProviders(providers);
        setAllProviders(data.all_providers || []);

        setSelectedIds(
          new Set(
            providers
              .filter((p: any) => p.is_checklist)
              .map((p: any) => p.provider_id)
          )
        );

        setMatchMeta({
          skill_source: data.skill_source,
          skills_missing: data.skills_missing,
          match_status: data.match_status,
        });
      })
      .catch((err) => console.error('Failed to load checklist:', err))
      .finally(() => setLoadingProviders(false));
  };

  useEffect(() => {
    fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfp.project_id, rfp.status]);

  // ── The list that actually renders — matched OR all (when toggled) ─────────
  // When "show all" is on we use the full provider list with a synthetic
  // match_score of 0, so the same row component works for both paths.
  const displayProviders: any[] = showAllProviders && matchedProviders.length === 0
    ? allProviders.map((p) => ({ ...p, match_score: 0, reason: null, is_checklist: false, notified: false }))
    : matchedProviders;

  // ── Filter by search query ─────────────────────────────────────────────────
  const filteredProviders = providerSearch.trim()
    ? displayProviders.filter((p) =>
      p.organization_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(providerSearch.toLowerCase())
    )
    : displayProviders;

  // ── Check-all operates only on the currently visible filtered list ─────────
  const selectableIds = filteredProviders
    .filter((p) => !p.is_checklist)
    .map((p) => p.provider_id);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleCheckAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleProvider = (providerId: string, alreadyChecklisted: boolean) => {
    if (alreadyChecklisted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  // ── Send to selected providers ─────────────────────────────────────────────
  const handleSendChecklist = async () => {
    const newlySelected = displayProviders
      .filter((p) => selectedIds.has(p.provider_id) && !p.is_checklist)
      .map((p) => p.provider_id);

    if (newlySelected.length === 0) {
      setChecklistMsg({ type: 'error', text: 'Select at least one new provider to send.' });
      return;
    }

    setSendingChecklist(true);
    setChecklistMsg(null);

    try {
      const res = await fetch(`/api/admin/rfp/${rfp.project_id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider_ids: newlySelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setChecklistMsg({
        type: 'success',
        text: `${data.added} provider(s) checklisted, ${data.emailed} email(s) sent.`,
      });
      fetchChecklist();
    } catch (err: any) {
      setChecklistMsg({ type: 'error', text: err.message || 'Failed to send checklist' });
    } finally {
      setSendingChecklist(false);
    }
  };

  const newSelectionCount = displayProviders.filter(
    (p) => selectedIds.has(p.provider_id) && !p.is_checklist
  ).length;

  const statusLabel =
    rfp.status === 'open'
      ? 'Approved'
      : rfp.status === 'closed'
        ? 'Rejected'
        : 'Pending Review';

  const statusColor =
    rfp.status === 'open'
      ? 'bg-emerald-100 text-emerald-700'
      : rfp.status === 'closed'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shrink-0">
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
          <button onClick={onClose} className="text-3xl hover:text-gray-200">
            ×
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">

          <h2 className="text-xl font-bold text-gray-900 mb-3">{rfp.title}</h2>

          {hasAttachments && (
            <AiSummaryInline analysis={aiAnalysis} loading={aiLoading} error={aiError} />
          )}

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
                    rel="noreferrer"
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

          {/* Matched Providers + Checklist — only for approved RFPs */}
          {rfp.status === 'open' && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  🎯 MATCHED PROVIDERS
                  {!loadingProviders && matchedProviders.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({matchedProviders.filter((p) => p.is_checklist).length} checklisted
                      of {matchedProviders.length} matched)
                    </span>
                  )}
                  {!loadingProviders && showAllProviders && matchedProviders.length === 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      (showing all {allProviders.length} providers · 0% match)
                    </span>
                  )}
                </h3>

                <div className="flex items-center gap-2">
                  {selectableIds.length > 0 && (
                    <button
                      onClick={toggleCheckAll}
                      className="shrink-0 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                    >
                      {allSelected ? 'Uncheck All' : 'Check All'}
                    </button>
                  )}

                  {(matchedProviders.length > 0 || showAllProviders) && (
                    <button
                      onClick={handleSendChecklist}
                      disabled={sendingChecklist || newSelectionCount === 0}
                      className="shrink-0 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingChecklist
                        ? 'Sending…'
                        : `Send to ${newSelectionCount} new provider${newSelectionCount === 1 ? '' : 's'}`}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Search box — shown when there are providers to search ───── */}
              {!loadingProviders && (matchedProviders.length > 0 || showAllProviders) && (
                <div className="mb-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search providers by name or email…"
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {providerSearch && (
                      <button
                        onClick={() => setProviderSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {providerSearch && (
                    <p className="text-xs text-gray-400 mt-1 pl-1">
                      {filteredProviders.length} result{filteredProviders.length !== 1 ? 's' : ''} for "{providerSearch}"
                    </p>
                  )}
                </div>
              )}

              {checklistMsg && (
                <div
                  className={`mb-3 px-4 py-2 rounded-xl text-sm ${checklistMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                >
                  {checklistMsg.type === 'success' ? '✅ ' : '⚠️ '}
                  {checklistMsg.text}
                </div>
              )}

              {loadingProviders ? (
                <div className="flex items-center gap-3 text-sm text-gray-500 py-2">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                  Running live provider match…
                </div>
              ) : matchedProviders.length === 0 && !showAllProviders ? (
                <ZeroMatchBanner
                  skillSource={matchMeta.skill_source}
                  skillsMissing={matchMeta.skills_missing}
                  onShowAll={() => setShowAllProviders(true)}
                />
              ) : filteredProviders.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">
                  No providers match "{providerSearch}".{' '}
                  <button
                    onClick={() => setProviderSearch('')}
                    className="text-blue-600 hover:underline"
                  >
                    Clear search
                  </button>
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredProviders.map((p: any) => {
                    let matchedSkills: string[] = [];
                    try {
                      const reason =
                        typeof p.reason === 'string' ? JSON.parse(p.reason) : p.reason;
                      matchedSkills = reason?.matched_skills || [];
                    } catch { }

                    const isChecked = selectedIds.has(p.provider_id);
                    const isLocked = !!p.is_checklist;
                    const score = p.match_score ?? 0;

                    return (
                      <label
                        key={p.provider_id}
                        className={`flex items-start justify-between border rounded-xl px-4 py-3 transition-colors ${isLocked
                            ? 'bg-emerald-50 border-emerald-200 cursor-default'
                            : isChecked
                              ? 'bg-blue-50 border-blue-300 cursor-pointer'
                              : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() => toggleProvider(p.provider_id, isLocked)}
                            className="w-4 h-4 mt-1 accent-blue-600 shrink-0 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                              {p.organization_name}
                              {isLocked && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  {p.notified ? 'Notified' : 'Checklisted'}
                                </span>
                              )}
                            </div>
                            {matchedSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {matchedSkills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 mt-1">
                                {score === 0 ? 'No matching skills' : 'No specific skills listed'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4 flex-shrink-0">
                          <div
                            className={`text-sm font-bold ${score >= 0.8
                                ? 'text-emerald-600'
                                : score >= 0.6
                                  ? 'text-blue-600'
                                  : score > 0
                                    ? 'text-amber-600'
                                    : 'text-gray-400'  // 0% match shown in grey
                              }`}
                          >
                            {Math.round(score * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">match</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Once a provider is checklisted and emailed, they cannot be removed from
                this list. New matches you add later will only email the newly-selected
                providers.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-3 flex items-center justify-end gap-3 shrink-0">
          {isDecided ? (
            <div
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${rfp.status === 'open'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
                }`}
            >
              {rfp.status === 'open' ? '✅ RFP has been approved' : '❌ RFP has been rejected'}
            </div>
          ) : (
            <>
              <button
                onClick={() => onAction(rfp.project_id, 'reject')}
                className="px-5 py-2.5 rounded-xl text-red-700 hover:bg-red-100 font-medium border border-red-300 text-sm"
              >
                Reject Submission
              </button>

              <button
                onClick={() => onAction(rfp.project_id, 'changes')}
                className="px-5 py-2.5 rounded-xl border border-gray-400 hover:bg-gray-200 text-gray-900 font-medium text-sm"
              >
                Request Changes
              </button>

              <button
                onClick={() => onAction(rfp.project_id, 'approve')}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm"
              >
                Approve & Post
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-200 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}