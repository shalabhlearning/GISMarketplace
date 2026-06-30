// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, FileText, CheckCircle2, XCircle, Users } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  topBuyer: string;
}

interface Rfp {
  project_id: string;
  title: string;
  description: string;
  buyer_name: string;
  created_at: string;
  status: string;
  category?: string;
}

interface WeeklyPoint {
  label: string;
  volume: number;
  approved: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  switch (status) {
    case 'in_review':
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
          Pending Review
        </span>
      );
    case 'open':
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
          Approved
        </span>
      );
    case 'closed':
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
          Rejected
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
          {status}
        </span>
      );
  }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
};

const categoryIcon = (title: string) => {
  const t = title?.toLowerCase() || '';
  if (t.includes('server') || t.includes('infra') || t.includes('cloud')) return '🖥️';
  if (t.includes('clean') || t.includes('facilit')) return '🏢';
  if (t.includes('crm') || t.includes('software') || t.includes('dev')) return '💻';
  if (t.includes('market') || t.includes('agency')) return '📣';
  return '📄';
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    totalPending: 0, totalApproved: 0, totalRejected: 0, topBuyer: '—',
  });
  const [recentRfps, setRecentRfps] = useState<Rfp[]>([]);
  const [allRfps, setAllRfps] = useState<Rfp[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.user_type !== 'admin') window.location.href = '/';
        else setAuthorized(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/rfp/stats'),
        fetch('/api/admin/rfp/list?status=all'),
      ]);

      const statsData: Stats = await statsRes.json();
      const listData = await listRes.json();
      const rfps: Rfp[] = listData.rfps || [];

      setStats({
        totalPending: statsData.totalPending,
        totalApproved: statsData.totalApproved,
        totalRejected: statsData.totalRejected,
        topBuyer: statsData.topBuyer || '—',
      });

      setAllRfps(rfps);
      setRecentRfps(rfps.slice(0, 5));

      // Build weekly volume from real data (last 6 weeks)
      const weeks: Record<string, { volume: number; approved: number }> = {};
      rfps.forEach(r => {
        const d = new Date(r.created_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!weeks[key]) weeks[key] = { volume: 0, approved: 0 };
        weeks[key].volume++;
        if (r.status === 'open') weeks[key].approved++;
      });

      const sorted = Object.entries(weeks)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-6)
        .map(([label, v]) => ({ label, ...v }));

      // Pad to at least 6 points for a nice chart
      while (sorted.length < 6) {
        sorted.unshift({ label: `Week ${sorted.length + 1}`, volume: 0, approved: 0 });
      }

      setWeeklyData(sorted);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchAll();
      const id = setInterval(fetchAll, 15000);
      return () => clearInterval(id);
    }
  }, [authorized, fetchAll]);

  // ── Navigate to detail page ─────────────────────────────────────────────────
  const goToRfp = (projectId: string) => {
    router.push(`/admin/rfp-review/${projectId}`);
  };

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
        Checking admin access...
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const total = stats.totalApproved + stats.totalRejected + stats.totalPending;
  const approvedPct = total ? Math.round((stats.totalApproved / total) * 100) : 0;
  const rejectedPct = total ? Math.round((stats.totalRejected / total) * 100) : 0;
  const pendingPct  = total ? Math.round((stats.totalPending  / total) * 100) : 0;

  const pieData = [
    { name: 'Approved', value: stats.totalApproved, color: '#22c55e' },
    { name: 'Rejected', value: stats.totalRejected, color: '#ef4444' },
    { name: 'Pending',  value: stats.totalPending,  color: '#f59e0b' },
  ];

  return (
    <AdminLayout>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Platform Administration</h1>
          <p className="text-muted-foreground mt-1">Monitor platform health, approvals, and system alerts.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            ↻ Refresh
          </button>
          <a
            href="/admin/rfp-review"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            ☰ Open Approval Queue
          </a>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Pending Approvals"
          value={stats.totalPending}
          badge={null}
          icon={<FileText className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          label="Active RFPs"
          value={stats.totalApproved}
          badge={{ text: 'Approved', color: 'bg-emerald-100 text-emerald-700' }}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="Rejected RFPs"
          value={stats.totalRejected}
          badge={null}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          label="Most Active Buyer"
          value={stats.topBuyer}
          isText
          badge={null}
          icon={<Users className="w-5 h-5 text-violet-500" />}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-foreground">RFP Volume Over Time</h3>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" /> RFP Volume
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-500 rounded-full inline-block" /> Approval Rate
              </span>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-4xl font-semibold text-foreground">{total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Total RFPs Created</p>
            </div>
            <div className="flex flex-col justify-center gap-1 text-sm text-foreground">
              <BarStat label="Approved" pct={approvedPct} count={stats.totalApproved} color="bg-emerald-500" />
              <BarStat label="Rejected" pct={rejectedPct} count={stats.totalRejected} color="bg-red-500" />
              <BarStat label="Pending"  pct={pendingPct}  count={stats.totalPending}  color="bg-amber-500" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ 
                  borderRadius: 12, 
                  border: '1px solid hsl(var(--border))', 
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))'
                }}
                cursor={{ stroke: 'hsl(var(--border))' }}
              />
              <Area type="monotone" dataKey="volume"   stroke="#22c55e" strokeWidth={2} fill="url(#volGrad)" name="RFP Volume" />
              <Area type="monotone" dataKey="approved" stroke="#60a5fa" strokeWidth={2} fill="url(#appGrad)" name="Approved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Ratio */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col">
          <h3 className="font-semibold text-foreground mb-6">Approval Ratio</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <PieChart width={180} height={180}>
                <Pie
                  data={pieData}
                  cx={85} cy={85}
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{approvedPct}%</p>
                  <p className="text-xs text-emerald-600">approved</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-6">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent RFP Submissions ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent RFP Submissions</h3>
          <a href="/admin/rfp-review" className="text-sm text-primary font-medium hover:underline">
            View All →
          </a>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border text-xs uppercase text-muted-foreground">
              <th className="px-6 py-3 text-left font-medium">RFP Title & ID</th>
              <th className="px-6 py-3 text-left font-medium">Buyer</th>
              <th className="px-6 py-3 text-left font-medium">Category</th>
              <th className="px-6 py-3 text-left font-medium">Submitted</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentRfps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No RFPs yet
                </td>
              </tr>
            ) : (
              recentRfps.map(rfp => (
                <tr
                  key={rfp.project_id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => goToRfp(rfp.project_id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{categoryIcon(rfp.title)}</span>
                      <div>
                        <p className="font-medium text-foreground">{rfp.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {rfp.project_id?.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {rfp.buyer_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-foreground">{rfp.buyer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {rfp.category || '—'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {timeAgo(rfp.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(rfp.status)}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => goToRfp(rfp.project_id)}
                      className="text-primary hover:text-primary/80 font-medium text-sm"
                    >
                      {rfp.status === 'in_review' ? 'Review →' : 'View →'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label, value, badge, icon, isText = false,
}: {
  label: string;
  value: number | string;
  badge?: { text: string; color: string } | null;
  icon: React.ReactNode;
  isText?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:shadow transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={`mt-3 font-semibold text-foreground ${isText ? 'text-xl leading-tight' : 'text-4xl'}`}>
        {value}
      </p>
      {badge && (
        <span className={`mt-3 inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function BarStat({
  label, pct, count, color,
}: {
  label: string; pct: number; count: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-muted-foreground">{label}</span>
      <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">{pct}%</span>
      <span className="text-xs text-muted-foreground">{count} RFPs</span>
    </div>
  );
}