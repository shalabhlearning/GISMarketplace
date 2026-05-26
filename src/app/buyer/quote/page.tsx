// src/app/buyer/quote/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Plus, RotateCcw, Mail, Calendar,
} from 'lucide-react';

interface RfpCard {
  project_id: string;
  title: string;
  status: string;
  budget: number | null;
  submission_deadline: string | null;
  created_at: string;
  quotes_count: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open:      { label: 'Open',           cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    in_review: { label: 'Under Review',   cls: 'bg-amber-100  text-amber-700  border-amber-200'  },
    contracted: { label: 'Contracted',    cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
    closed:    { label: 'Closed',         cls: 'bg-gray-100   text-gray-600   border-gray-200'   },
  };
  const s = map[status] ?? { label: status?.replace('_', ' ').toUpperCase(), cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'open')      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'in_review') return <AlertCircle  className="w-5 h-5 text-amber-500"  />;
  if (status === 'contracted')   return <CheckCircle2 className="w-5 h-5 text-blue-500"   />;
  return                             <XCircle      className="w-5 h-5 text-gray-400"   />;
}

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)  return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function deadlineLabel(d: string | null) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)   return { text: 'Deadline passed', cls: 'text-red-500' };
  if (days === 0) return { text: 'Closes today',    cls: 'text-red-500' };
  if (days <= 3)  return { text: `Closes in ${days}d`, cls: 'text-amber-600' };
  return                  { text: `Closes in ${days}d`, cls: 'text-gray-500' };
}

export default function BuyerRfpsAndQuotesPage() {
  const router = useRouter();
  const [rfps, setRfps]       = useState<RfpCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'open' | 'in_review' | 'contracted' | 'closed'>('all');

  useEffect(() => {
    fetch('/api/buyer/quotes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { rfps: [] })
      .then(d => setRfps(d.rfps || []))
      .catch(() => setRfps([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? rfps : rfps.filter(r => r.status === filter);

  const counts = {
    all:       rfps.length,
    open:      rfps.filter(r => r.status === 'open').length,
    in_review: rfps.filter(r => r.status === 'in_review').length,
    contracted: rfps.filter(r => r.status === 'contracted').length,
    closed:    rfps.filter(r => r.status === 'closed').length,
  };

  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RotateCcw className="w-7 h-7 animate-spin" />
          <span className="text-sm">Loading your RFPs…</span>
        </div>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      <div className="space-y-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RFPs & Quotes</h1>
            <p className="text-gray-500 mt-1 text-sm">Click any RFP to view and manage received quotes.</p>
          </div>
          <button
            onClick={() => router.push('/buyer/create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-200 transition-all"
          >
            <Plus className="w-4 h-4" /> New RFP
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: 'all',       label: 'All RFPs'     },
            { key: 'open',      label: 'Open'         },
            { key: 'in_review', label: 'Under Review' },
            { key: 'contracted', label: 'Contracted'      },
            { key: 'closed',    label: 'Closed'       },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filter === key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* RFP Cards Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 bg-white rounded-2xl border border-gray-100 shadow-sm gap-4">
            <FileText className="w-10 h-10 text-gray-300" />
            <div className="text-center">
              <p className="font-medium text-gray-700">No RFPs found</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'all' ? 'Create your first RFP to get started.' : `No ${filter.replace('_', ' ')} RFPs.`}
              </p>
            </div>
            {filter === 'all' && (
              <button onClick={() => router.push('/buyer/create')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                Create RFP
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((rfp) => {
              const dl = deadlineLabel(rfp.submission_deadline);
              const canViewQuotes = rfp.status === 'open' || rfp.status === 'contracted';

              return (
                <div
                  key={rfp.project_id}
                  onClick={() => router.push(`/buyer/quote/${rfp.project_id}`)}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Card top accent */}
                  <div className={`h-1 w-full ${
                    rfp.status === 'open'      ? 'bg-emerald-500' :
                    rfp.status === 'in_review' ? 'bg-amber-400'  :
                    rfp.status === 'contracted'   ? 'bg-blue-500'   : 'bg-gray-300'
                  }`} />

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          rfp.status === 'open'      ? 'bg-emerald-50' :
                          rfp.status === 'in_review' ? 'bg-amber-50'  :
                          rfp.status === 'contracted'   ? 'bg-blue-50'   : 'bg-gray-50'
                        }`}>
                          <StatusIcon status={rfp.status} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 leading-tight truncate group-hover:text-emerald-700 transition-colors">
                            {rfp.title || 'Untitled RFP'}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {rfp.project_id?.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={rfp.status} />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Quotes
                        </p>
                        <p className="text-xl font-bold text-gray-900">{rfp.quotes_count}</p>
                        {canViewQuotes && rfp.quotes_count > 0 && (
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">View all →</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Budget
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Open'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {relTime(rfp.created_at)}
                        </span>
                        {dl && (
                          <span className={`flex items-center gap-1 ${dl.cls}`}>
                            <Calendar className="w-3 h-3" /> {dl.text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
                        {rfp.status === 'in_review' ? 'Pending' : rfp.status === 'contracted' ? 'Contracted' : 'View Quotes'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}