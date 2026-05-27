'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ArrowLeft, FileText, DollarSign, Clock, Paperclip,
  CheckCircle2, XCircle, Star, RotateCcw, X, ChevronDown,
  ChevronUp, Award, AlertTriangle, Eye,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Quote {
  proposal_id: string;
  provider_name: string;
  provider_email: string;
  bid_amount: number;
  status: string;
  submitted: string;
  proposal_message: string;
  credits_used: number;
}

interface ParsedProposal {
  technical?: string;
  delivery?: string;
  milestones?: { phase?: string; title?: string; percentage?: number }[];
  attachments?: string[];
  key_terms?: string;
}

interface RfpInfo {
  project_id: string;
  title: string;
  status: string;
  budget: number | null;
  submission_deadline: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseProposal(msg: string): ParsedProposal {
  try { return JSON.parse((msg || '{}').trim()); } catch { return {}; }
}

function initials(email: string) {
  return email?.split('@')[0]?.slice(0, 2).toUpperCase() || '??';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium ${type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      {msg}
      <button onClick={onClose}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open, onConfirm, onCancel, providerName, action,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  providerName: string;
  action: 'award' | 'reject';
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 mx-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${action === 'award' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {action === 'award'
            ? <Award className="w-6 h-6 text-emerald-600" />
            : <AlertTriangle className="w-6 h-6 text-red-500" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {action === 'award' ? 'Award this contract?' : 'Reject this quote?'}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          {action === 'award'
            ? <><span>You're awarding the contract to </span><strong className="text-gray-900">{providerName}</strong><span>. All other quotes will be automatically rejected. This cannot be undone.</span></>
            : <><span>You're rejecting the quote from </span><strong className="text-gray-900">{providerName}</strong>.</>}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
              action === 'award'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-red-500 hover:bg-red-600 shadow-red-200'
            }`}
          >
            {action === 'award' ? 'Yes, Award Contract' : 'Yes, Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quote Card ───────────────────────────────────────────────────────────────
function QuoteCard({
  quote, isBestValue, isAwarded, rfpAwarded,
  onAward, onReject,
}: {
  quote: Quote;
  isBestValue: boolean;
  isAwarded: boolean;
  rfpAwarded: boolean;
  onAward: (q: Quote) => void;
  onReject: (q: Quote) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = parseProposal(quote.proposal_message);

  const statusStyles: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    accepted:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected:  'bg-red-100 text-red-500 border-red-200',
  };
  const statusStyle = statusStyles[quote.status] ?? 'bg-gray-100 text-gray-500 border-gray-200';

  const isRejected = quote.status === 'rejected';
  const isAccepted = quote.status === 'accepted';

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all overflow-hidden ${
      isAccepted  ? 'border-emerald-400 shadow-emerald-100' :
      isRejected  ? 'border-gray-200 opacity-60' :
      isBestValue ? 'border-emerald-300' : 'border-gray-100 hover:border-emerald-200'
    }`}>
      {isBestValue && !isRejected && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" /> Best Value
        </div>
      )}
      {isAccepted && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" /> Contract Awarded
        </div>
      )}

      <div className="p-5">
        {/* Provider header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials(quote.provider_email)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{quote.provider_name || quote.provider_email}</p>
              <p className="text-xs text-gray-400 font-mono">QT-{quote.proposal_id?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle}`}>
            {quote.status === 'submitted' ? 'New' : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </span>
        </div>

        {/* Price + Timeline */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Total Price
            </p>
            <p className={`text-xl font-bold ${isBestValue && !isRejected ? 'text-emerald-700' : 'text-gray-900'}`}>
              ${Number(quote.bid_amount).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Lead Time
            </p>
            <p className="text-sm font-semibold text-gray-900">{p.delivery || 'Not specified'}</p>
          </div>
        </div>

        {/* Key Terms + Attachments */}
        <div className="space-y-2 mb-4 text-sm">
          {p.key_terms && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-500 shrink-0">Key Terms:</span>
              <span className="text-gray-800 text-right">{p.key_terms}</span>
            </div>
          )}
          {p.attachments && p.attachments.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Attachments:</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Paperclip className="w-3.5 h-3.5" /> {p.attachments.length} files
              </span>
            </div>
          )}
        </div>

        {/* Expandable Technical Detail */}
        {p.technical && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {expanded ? 'Hide' : 'View'} Technical Proposal
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expanded && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {p.technical}
              </div>
            )}
          </div>
        )}

        {/* Milestones */}
        {expanded && p.milestones && p.milestones.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500">Payment Milestones</p>
            {p.milestones.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-700">{m.phase || m.title}</span>
                {m.percentage && <span className="font-bold text-emerald-700">{m.percentage}%</span>}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!rfpAwarded && quote.status === 'submitted' && (
            <>
              <button
                onClick={() => onReject(quote)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-sm font-medium transition-all"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => onAward(quote)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-200 transition-all"
              >
                <Award className="w-4 h-4" /> Award Contract
              </button>
            </>
          )}
          {isAccepted && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Contract Awarded
            </div>
          )}
          {isRejected && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm font-medium border border-gray-200">
              <XCircle className="w-4 h-4" /> Rejected
            </div>
          )}
          {rfpAwarded && quote.status === 'submitted' && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm font-medium border border-gray-200">
              Auto-rejected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RfpQuotesPage() {
  const { project_id } = useParams<{ project_id: string }>();
  const router = useRouter();

  const [rfp, setRfp]       = useState<RfpInfo | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastState, setToastState] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{ quote: Quote; action: 'award' | 'reject' } | null>(null);
  const [acting, setActing] = useState(false);

  const [statusFilter, setStatusFilter]   = useState<'all' | 'submitted' | 'accepted' | 'rejected'>('all');
  const [maxBudget, setMaxBudget]         = useState<number>(Infinity);
  const [searchVendor, setSearchVendor]   = useState('');

  const showToast = (msg: string, type: 'success' | 'error') => setToastState({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rfpRes, quotesRes] = await Promise.all([
        fetch(`/api/rfp/single?project_id=${project_id}`, { credentials: 'include' }),
        fetch(`/api/buyer/rfp-quotes?project_id=${project_id}`, { credentials: 'include' }),
      ]);
      if (rfpRes.ok) setRfp(await rfpRes.json());
      if (quotesRes.ok) setQuotes((await quotesRes.json()).quotes || []);
    } catch { }
    setLoading(false);
  }, [project_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAward = async (quote: Quote) => {
    setActing(true);
    setConfirm(null);
    try {
      const res = await fetch('/api/buyer/award-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: quote.proposal_id, project_id }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Contract awarded! Other quotes auto-rejected.', 'success');
        await fetchData();
      } else {
        showToast(data.error || 'Failed to award contract', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    }
    setActing(false);
  };

  const handleReject = async (quote: Quote) => {
    setActing(true);
    setConfirm(null);
    try {
      const res = await fetch('/api/buyer/reject-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: quote.proposal_id }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Quote rejected.', 'success');
        await fetchData();
      } else {
        showToast(data.error || 'Failed to reject quote', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    }
    setActing(false);
  };

  const submitted   = quotes.filter(q => q.status === 'submitted');
  const minBid      = submitted.length ? Math.min(...submitted.map(q => Number(q.bid_amount))) : null;
  const rfpAwarded  = quotes.some(q => q.status === 'accepted') || rfp?.status === 'contracted';

  const filtered = quotes.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (
      searchVendor &&
      !q.provider_name?.toLowerCase().includes(searchVendor.toLowerCase()) &&
      !q.provider_email?.toLowerCase().includes(searchVendor.toLowerCase())
    ) return false;
    if (maxBudget !== Infinity && Number(q.bid_amount) > maxBudget) return false;
    return true;
  });

  const maxQuoteBid = Math.max(...quotes.map(q => Number(q.bid_amount)), 0);

  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RotateCcw className="w-7 h-7 animate-spin" />
          <span className="text-sm">Loading quotes…</span>
        </div>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      {toastState && (
        <Toast
          msg={toastState.msg}
          type={toastState.type}
          onClose={() => setToastState(null)}
        />
      )}

      <ConfirmModal
        open={!!confirm}
        action={confirm?.action ?? 'award'}
        providerName={confirm?.quote.provider_name || confirm?.quote.provider_email || ''}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === 'award') {
            handleAward(confirm.quote);
          } else {
            handleReject(confirm.quote);
          }
        }}
        onCancel={() => setConfirm(null)}
      />

      {acting && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
            <RotateCcw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="font-medium text-gray-800">Processing…</span>
          </div>
        </div>
      )}

      <div className="flex gap-6 py-6 min-h-screen">

        {/* ── Filters Sidebar ── */}
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
              <button
                onClick={() => { setStatusFilter('all'); setSearchVendor(''); setMaxBudget(Infinity); }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Reset All
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vendor</p>
              <input
                value={searchVendor}
                onChange={e => setSearchVendor(e.target.value)}
                placeholder="Search vendors…"
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quote Status</p>
              <div className="space-y-2">
                {([
                  { val: 'all',       label: 'All',      count: quotes.length },
                  { val: 'submitted', label: 'New',      count: quotes.filter(q => q.status === 'submitted').length },
                  { val: 'accepted',  label: 'Awarded',  count: quotes.filter(q => q.status === 'accepted').length },
                  { val: 'rejected',  label: 'Rejected', count: quotes.filter(q => q.status === 'rejected').length },
                ] as const).map(({ val, label, count }) => (
                  <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setStatusFilter(val)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                        statusFilter === val
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'border-gray-300 group-hover:border-emerald-400'
                      }`}
                    >
                      {statusFilter === val && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{label}</span>
                    <span className="text-xs text-gray-400">({count})</span>
                  </label>
                ))}
              </div>
            </div>

            {maxQuoteBid > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Max Price{' '}
                  <span className="ml-1 text-emerald-600 normal-case font-normal">
                    {maxBudget === Infinity ? 'Any' : `$${maxBudget.toLocaleString()}`}
                  </span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={maxQuoteBid}
                  value={maxBudget === Infinity ? maxQuoteBid : maxBudget}
                  onChange={e =>
                    setMaxBudget(
                      Number(e.target.value) === maxQuoteBid ? Infinity : Number(e.target.value),
                    )
                  }
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${maxQuoteBid.toLocaleString()}+</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <button
              onClick={() => router.push('/buyer/quote')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to RFPs
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{rfp?.title || 'RFP Details'}</h1>
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                    RFP-{project_id?.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {quotes.length} Quote{quotes.length !== 1 ? 's' : ''} Received
                  {rfp?.submission_deadline && (() => {
                    const days = Math.ceil(
                      (new Date(rfp.submission_deadline).getTime() - Date.now()) / 86400000,
                    );
                    return days > 0 ? ` • Closes in ${days} days` : ' • Deadline passed';
                  })()}
                </p>
              </div>
              {rfpAwarded && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold shrink-0">
                  <Award className="w-4 h-4" /> Contract Awarded
                </div>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 bg-white rounded-2xl border border-gray-100 shadow-sm gap-3">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-gray-500 font-medium">No quotes match your filters</p>
              <p className="text-sm text-gray-400">Try adjusting the filters on the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map(q => (
                <QuoteCard
                  key={q.proposal_id}
                  quote={q}
                  isBestValue={minBid !== null && Number(q.bid_amount) === minBid && q.status === 'submitted'}
                  isAwarded={q.status === 'accepted'}
                  rfpAwarded={rfpAwarded}
                  onAward={q => setConfirm({ quote: q, action: 'award' })}
                  onReject={q => setConfirm({ quote: q, action: 'reject' })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}