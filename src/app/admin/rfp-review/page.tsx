// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Search, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterType = 'all' | 'in_review' | 'open' | 'closed';

interface Rfp {
  project_id: string;
  title: string;
  description: string;
  buyer_name: string;
  created_at: string;
  status: string;
  budget?: string | number;
  start_date?: string;
  submission_deadline?: string;
  end_date?: string;
  attachments?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const categoryIcon = (title: string) => {
  const t = title?.toLowerCase() || '';
  if (t.includes('server') || t.includes('infra') || t.includes('cloud')) return '🖥️';
  if (t.includes('clean') || t.includes('facilit')) return '🏢';
  if (t.includes('crm') || t.includes('software') || t.includes('dev')) return '💻';
  if (t.includes('market') || t.includes('agency')) return '📣';
  if (t.includes('gis') || t.includes('map') || t.includes('geo')) return '🗺️';
  if (t.includes('utility') || t.includes('power') || t.includes('energy')) return '⚡';
  if (t.includes('smart') || t.includes('city')) return '🏙️';
  return '📄';
};

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  in_review: {
    label: 'Pending Review',
    pill: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  open: {
    label: 'Approved',
    pill: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  closed: {
    label: 'Rejected',
    pill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminRfpQueuePage() {
  const router = useRouter();

  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [filtered, setFiltered] = useState<Rfp[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.user_type !== 'admin') window.location.href = '/';
        else setAuthorized(true);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Fetch RFPs ─────────────────────────────────────────────────────────────
  const fetchRfps = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/rfp/list?status=${activeFilter}`);
      const data = await res.json();
      setRfps(data.rfps || []);
    } catch (err) {
      console.error('Failed to fetch RFPs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authorized) fetchRfps();
  }, [authorized, activeFilter, refreshKey]);

  // ── Search filter ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(rfps);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      rfps.filter(
        r =>
          r.title?.toLowerCase().includes(q) ||
          r.buyer_name?.toLowerCase().includes(q) ||
          r.project_id?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, rfps]);

  // ── Navigate to detail page ─────────────────────────────────────────────────
  const goToRfp = (projectId: string) => {
    router.push(`/admin/rfp-review/${projectId}`);
  };

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts = {
    all: rfps.length,
    in_review: rfps.filter(r => r.status === 'in_review').length,
    open: rfps.filter(r => r.status === 'open').length,
    closed: rfps.filter(r => r.status === 'closed').length,
  };

  if (authLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground text-sm">
        Checking admin access...
      </div>
    );
  }

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'All Submissions' },
    { key: 'in_review', label: 'Pending Review'  },
    { key: 'open',      label: 'Approved'         },
    { key: 'closed',    label: 'Rejected'          },
  ];

  return (
    <AdminLayout>
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">RFP Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, or reject incoming RFP submissions from buyers.
          </p>
        </div>

        <button
          onClick={() => fetchRfps(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary Chips ── */}
      <div className="flex gap-4 mb-8">
        <SummaryChip label="Pending Review" value={counts.in_review} color="bg-amber-50 text-amber-700 border-amber-200" />
        <SummaryChip label="Approved"       value={counts.open}      color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <SummaryChip label="Rejected"       value={counts.closed}    color="bg-red-50 text-red-700 border-red-200" />
        <SummaryChip label="Total"          value={counts.all}       color="bg-muted text-muted-foreground border-border" />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

        {/* Filter Tabs + Search */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveFilter(key); setSearchQuery(''); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === key
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label}
                {activeFilter === 'all' && key !== 'all' && (
                  <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-background/20`}>
                    {key === 'in_review' ? counts.in_review : key === 'open' ? counts.open : counts.closed}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, buyer, ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 w-80 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-24 text-center text-muted-foreground text-sm animate-pulse">
            Loading RFPs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-lg">No RFPs found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Try clearing the search or changing the filter.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-6 py-4 text-left font-medium">RFP Title & ID</th>
                <th className="px-6 py-4 text-left font-medium">Buyer</th>
                <th className="px-6 py-4 text-left font-medium">Budget</th>
                <th className="px-6 py-4 text-left font-medium">Submitted</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(rfp => {
                const cfg = statusConfig[rfp.status] ?? {
                  label: rfp.status,
                  pill: 'bg-muted text-muted-foreground',
                  dot: 'bg-muted-foreground',
                };

                return (
                  <tr
                    key={rfp.project_id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => goToRfp(rfp.project_id)}
                  >
                    {/* Title + ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{categoryIcon(rfp.title)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-xs">
                            {rfp.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            #{rfp.project_id?.slice(0, 12)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Buyer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {rfp.buyer_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-foreground truncate max-w-[140px]">
                          {rfp.buyer_name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="px-6 py-4 text-foreground font-medium">
                      {rfp.budget ? `₹${Number(rfp.budget).toLocaleString()}` : '—'}
                    </td>

                    {/* Submitted */}
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {timeAgo(rfp.created_at)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${cfg.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => goToRfp(rfp.project_id)}
                        className={`text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
                          rfp.status === 'in_review'
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'text-primary hover:bg-primary/10'
                        }`}
                      >
                        {rfp.status === 'in_review' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/50 text-xs text-muted-foreground">
            Showing {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function SummaryChip({
  label, value, color,
}: {
  label: string; value: number; color: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium ${color}`}>
      <span className="text-2xl font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  );
}