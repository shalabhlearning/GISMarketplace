'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubscriptionAlert from '@/components/subscription/SubscriptionAlert';
import {
  FileText,
  Mail,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  total_rfps_created: number;
  approved_rfps: number;
  under_review: number;
  total_quotes_received: number;
}

interface RfpRow {
  project_id: string;
  title: string;
  created_at: string;
  status: string;
}

interface ActivityItem {
  type: 'approved' | 'quote' | 'warning';
  text: string;
  time: string;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = 'green',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'none';
  color?: 'green' | 'blue' | 'orange';
}) {
  const iconColors = { green: 'text-emerald-500', blue: 'text-blue-500', orange: 'text-orange-500' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
        {trend === 'up' && sub && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-0.5">
            <TrendingUp className="w-3 h-3" /> {sub}
          </span>
        )}
        {trend === 'down' && sub && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mb-0.5">
            <TrendingDown className="w-3 h-3" /> {sub}
          </span>
        )}
        {(!trend || trend === 'none') && sub && (
          <span className="text-xs text-gray-400 mb-0.5">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function ApprovalDonut({ approved, rejected, pending }: { approved: number; rejected: number; pending: number }) {
  const total = approved + rejected + pending || 1;
  const approvedPct = Math.round((approved / total) * 100);
  const rejectedPct = Math.round((rejected / total) * 100);
  const pendingPct  = 100 - approvedPct - rejectedPct;

  const r    = 60;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = [
    { pct: approvedPct, color: '#22c55e' },
    { pct: rejectedPct, color: '#ef4444' },
    { pct: pendingPct,  color: '#f59e0b' },
  ].map((s) => {
    const dash = (s.pct / 100) * circ;
    const gap  = circ - dash;
    const rotation = offset;
    offset += (s.pct / 100) * 360;
    return { ...s, dash, gap, rotation };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {arcs.map((arc, i) => (
            <circle
              key={i} cx="80" cy="80" r={r}
              fill="none" stroke={arc.color} strokeWidth="20"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={0}
              style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: '80px 80px' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{approvedPct}%</span>
        </div>
      </div>
      <div className="flex gap-6">
        {[
          { label: 'Approved', color: 'bg-emerald-500' },
          { label: 'Rejected', color: 'bg-red-500' },
          { label: 'Pending',  color: 'bg-amber-400' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open:      { label: 'Open',           className: 'bg-emerald-100 text-emerald-700' },
    in_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
    awarded:   { label: 'Awarded',        className: 'bg-blue-100 text-blue-700' },
    closed:    { label: 'Closed',         className: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status] ?? { label: status?.toUpperCase() ?? '—', className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

// ─── Activity icon ────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'approved') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (type === 'warning')  return <XCircle     className="w-5 h-5 text-amber-500" />;
  return <Mail className="w-5 h-5 text-blue-500" />;
}

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BuyerPage() {
  const [loading, setLoading]               = useState(true);
  const [stats, setStats]                   = useState<DashboardStats>({ total_rfps_created: 0, approved_rfps: 0, under_review: 0, total_quotes_received: 0 });
  const [myRfps, setMyRfps]                 = useState<RfpRow[]>([]);
  const [quotes, setQuotes]                 = useState<any[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [chartRange, setChartRange]         = useState<'30' | '90' | 'year'>('30');

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (!meData.user || meData.user.user_type !== 'buyer') {
          window.location.assign('/');
          return;
        }

        const [dashRes, quotesRes] = await Promise.all([
          fetch('/api/buyer/dashboard', { credentials: 'include' }),
          fetch('/api/buyer/quotes',    { credentials: 'include' }),
        ]);

        if (dashRes.ok) {
          const d = await dashRes.json();
          setStats({
            total_rfps_created:   Number(d.stats?.total_rfps_created   ?? 0),
            approved_rfps:        Number(d.stats?.approved_rfps        ?? 0),
            under_review:         Number(d.stats?.under_review         ?? 0),
            total_quotes_received: Number(d.stats?.total_quotes_received ?? 0),
          });
          setMyRfps(d.rfps || []);
          setHasSubscription(d.hasSubscription || false);
        }

        if (quotesRes.ok) {
          const q = await quotesRes.json();
          setQuotes(q.quotes || []);
        }
      } catch (err) {
        console.error('Buyer dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Chart data derived from real rfps ─────────────────────────────────────
  const chartData = useCallback(() => {
    const days = chartRange === '30' ? 30 : chartRange === '90' ? 90 : 365;
    const buckets: Record<string, { volume: number; approved: number }> = {};
    const now = Date.now();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = chartRange === 'year'
        ? d.toLocaleDateString('en-US', { month: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[label]) buckets[label] = { volume: 0, approved: 0 };
    }

    myRfps.forEach((rfp) => {
      const d = new Date(rfp.created_at);
      const label = chartRange === 'year'
        ? d.toLocaleDateString('en-US', { month: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`;
      if (buckets[label]) {
        buckets[label].volume += 1;
        if (rfp.status === 'open' || rfp.status === 'awarded') buckets[label].approved += 1;
      }
    });

    const entries = Object.entries(buckets);
    const step = Math.max(1, Math.floor(entries.length / 6));
    const result: { label: string; volume: number; approvalRate: number }[] = [];
    for (let i = 0; i < entries.length; i += step) {
      const slice = entries.slice(i, i + step);
      const vol = slice.reduce((s, [, v]) => s + v.volume, 0);
      const app = slice.reduce((s, [, v]) => s + v.approved, 0);
      result.push({
        label: `Week ${result.length + 1}`,
        volume: vol,
        approvalRate: vol > 0 ? Math.round((app / vol) * 100) : 0,
      });
    }
    return result;
  }, [myRfps, chartRange]);

  // ── Derived counts straight from real rfps ────────────────────────────────
  const totalRfps     = stats.total_rfps_created;
  const approvedCount = myRfps.filter(r => r.status === 'open' || r.status === 'awarded').length;
  const rejectedCount = myRfps.filter(r => r.status === 'closed').length;
  const pendingCount  = myRfps.filter(r => r.status === 'in_review').length;

  // ── Activity log: latest quotes + recently-opened RFPs ───────────────────
  const activity: ActivityItem[] = [
    ...quotes.slice(0, 3).map(q => ({
      type: 'quote' as const,
      text: `New quote received for "${q.rfp_title?.slice(0, 28) ?? 'an RFP'}"`,
      time: relativeTime(q.submitted),
    })),
    ...myRfps.filter(r => r.status === 'open').slice(0, 2).map(r => ({
      type: 'approved' as const,
      text: `RFP "${r.title?.slice(0, 28) ?? 'Untitled'}" is live`,
      time: relativeTime(r.created_at),
    })),
  ].slice(0, 5);

  if (loading) {
    return (
      <DashboardShell title="Buyer Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <RotateCcw className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading your dashboard…</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const data = chartData();

  return (
    <DashboardShell title="Buyer Dashboard">
      <div className="space-y-8 py-6">

        {!hasSubscription && <SubscriptionAlert />}

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track your RFPs, quotes received, and project progress.
          </p>
        </div>

        {/* ── Stat cards — all real data ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total RFPs created + how many are approved/live */}
          <StatCard
            label="RFPs Created"
            value={stats.total_rfps_created}
            sub={`${stats.approved_rfps} approved & live`}
            trend="none"
            icon={FileText}
            color="green"
          />
          {/* Total quotes received across all this buyer's RFPs — from DB */}
          <StatCard
            label="Quotes Received"
            value={stats.total_quotes_received}
            sub={
              stats.total_rfps_created > 0
                ? `Avg ${(stats.total_quotes_received / stats.total_rfps_created).toFixed(1)} per RFP`
                : 'No RFPs yet'
            }
            trend="none"
            icon={Mail}
            color="blue"
          />
          {/* RFPs under admin review — from DB */}
          <StatCard
            label="Under Review"
            value={stats.under_review}
            sub="Pending admin approval"
            trend="none"
            icon={Clock}
            color="orange"
          />
        </div>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* RFP Volume chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> RFP Volume Over Time
                </h3>
                <div className="mt-1">
                  <span className="text-3xl font-bold text-gray-900">{totalRfps.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 ml-2">Total RFPs Created</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: 'Approved', count: approvedCount, color: 'bg-emerald-500' },
                    { label: 'Rejected', count: rejectedCount, color: 'bg-red-400' },
                    { label: 'Pending',  count: pendingCount,  color: 'bg-amber-400' },
                  ].map(({ label, count, color }) => {
                    const pct = totalRfps > 0 ? Math.round((count / totalRfps) * 100) : 0;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Range selector */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 h-fit shrink-0">
                {(['30', '90', 'year'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      chartRange === r ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {r === 'year' ? 'This Year' : `${r} Days`}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                <Area type="monotone" dataKey="volume"       stroke="#22c55e" strokeWidth={2.5} fill="url(#volGrad)"  name="RFP Volume"     dot={false} />
                <Area type="monotone" dataKey="approvalRate" stroke="#3b82f6" strokeWidth={2}   fill="url(#rateGrad)" name="Approval Rate %" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-0.5 bg-emerald-500 rounded" /> RFP Volume
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-0.5 bg-blue-500 rounded" /> Approval Rate
              </div>
            </div>
          </div>

          {/* Approval Ratio donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Approval Ratio</h3>
            <div className="flex-1 flex items-center justify-center">
              <ApprovalDonut approved={approvedCount} rejected={rejectedCount} pending={pendingCount} />
            </div>
          </div>
        </div>

        {/* ── Recent Submissions + Activity Log ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent submissions table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Recent RFP Submissions</h3>
              <a href="/buyer/quote" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                View All →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left   text-xs font-bold text-gray-500 uppercase tracking-wider">RFP Title &amp; ID</th>
                    <th className="px-4 py-3 text-left   text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myRfps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-sm">
                        No RFPs yet. <a href="/buyer/create" className="text-emerald-600 hover:underline">Create your first one!</a>
                      </td>
                    </tr>
                  ) : (
                    myRfps.slice(0, 5).map((rfp) => (
                      <tr key={rfp.project_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 leading-tight">{rfp.title || 'Untitled RFP'}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">
                                RFP-{rfp.project_id?.slice(0, 8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                          {relativeTime(rfp.created_at)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={rfp.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href="/buyer/quote" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Activity Log</h3>
              <a href="/buyer/quote" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                View All
              </a>
            </div>

            <div className="divide-y divide-gray-50">
              {activity.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm italic">No recent activity.</div>
              ) : (
                activity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ActivityIcon type={item.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}