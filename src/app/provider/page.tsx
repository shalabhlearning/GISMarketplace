'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  Wallet, TrendingUp, CreditCard, AlertTriangle,
  Briefcase, FileText, Trophy, Package, DollarSign,
  Search, Plus, Zap, ArrowUp, Eye, CheckCircle2,
  Send, Sparkles, XCircle, ArrowDownCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
type Credits = { total: number; utilized: number; balance: number };
type Period = 'week' | 'month';

type ActivityType =
  | 'quote_sent'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'job_matched'
  | 'credit_added'
  | 'credit_deducted';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  meta: string | null;
  meta_kind: 'credit' | 'money' | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const num = (n: number) => n.toLocaleString();

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

// ── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanners({ balance }: { balance: number }) {
  if (balance >= 50) return null;
  return (
    <div className="mb-6">
      <div className="flex gap-3 items-start bg-white rounded-2xl border border-gray-100 border-l-4 border-l-red-400 px-5 py-4 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-red-500 text-sm">Low Credit Balance</p>
          <p className="text-xs text-gray-500">
            You have only <span className="font-semibold">{balance}</span> credits remaining.
          </p>
          <Link href="/subscribe" className="text-xs font-bold text-red-500 hover:text-red-600 mt-1 inline-block">
            Top up now →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, sub1, sub1Green, sub2, progressPct, footerLabel }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-gray-400" />
        </div>
      </div>
      <p className="text-[38px] font-bold text-gray-900 leading-none">{value}</p>
      {progressPct !== undefined && (
        <div className="mt-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progressPct, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
            <span>Lifetime</span>
            <span>{progressPct}% utilization</span>
          </div>
        </div>
      )}
      {sub1 && progressPct === undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className={sub1Green ? 'text-green-500 font-semibold' : 'text-gray-400'}>{sub1}</span>
          {sub2 && <span className="text-gray-400">{sub2}</span>}
        </div>
      )}
      {footerLabel && (
        <button className="mt-auto w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors">
          {footerLabel}
        </button>
      )}
    </div>
  );
}

// ── Pipe Card ────────────────────────────────────────────────────────────────
function PipeCard({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2.5">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center leading-tight">{label}</p>
    </div>
  );
}

// ── Activity Icon map ────────────────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ElementType;
  dot: string;
  iconColor: string;
}> = {
  quote_sent: { icon: Send, dot: 'bg-blue-400', iconColor: 'text-blue-500' },
  quote_accepted: { icon: CheckCircle2, dot: 'bg-green-500', iconColor: 'text-green-600' },
  quote_rejected: { icon: XCircle, dot: 'bg-red-400', iconColor: 'text-red-500' },
  job_matched: { icon: Sparkles, dot: 'bg-purple-400', iconColor: 'text-purple-600' },
  credit_added: { icon: ArrowUp, dot: 'bg-green-400', iconColor: 'text-green-600' },
  credit_deducted: { icon: ArrowDownCircle, dot: 'bg-gray-400', iconColor: 'text-gray-500' },
};

// ── Activity Item Component ───────────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
  const cfg = ACTIVITY_CONFIG[item.type] ?? ACTIVITY_CONFIG.credit_deducted;
  const Icon = cfg.icon;

  return (
    <div className="py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
          <p className="text-sm font-bold text-gray-900 leading-tight">{item.title}</p>
        </div>
        <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{timeAgo(item.created_at)}</span>
      </div>
      <p className="text-xs text-gray-500 ml-4 leading-relaxed">{item.description}</p>
      {item.meta && (
        <div className="ml-4 mt-2">
          {item.meta_kind === 'money' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              <ArrowUp className="w-2.5 h-2.5" /> {item.meta}
            </span>
          ) : item.meta_kind === 'credit' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              🪙 {item.meta}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
              {item.meta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Custom Tooltip for chart ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="font-semibold mb-0.5">{payload[0]?.payload?.label ?? label}</p>
      <p className="text-gray-300">{payload[0]?.value} credits used</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProviderPage() {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credits>({ total: 0, utilized: 0, balance: 0 });
  const [proposals, setProposals] = useState<any[]>([]);
  const [rfps, setRfps] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [trendLoading, setTrendLoading] = useState(false);

  // Fetch everything except trend (period-independent)
  useEffect(() => {
    (async () => {
      try {
        const [statsRes, quotesRes, rfpRes, activityRes] = await Promise.all([
          fetch('/api/provider/stats', { credentials: 'include' }),
          fetch('/api/provider/submitted-quotes', { credentials: 'include' }),
          fetch('/api/provider/available-rfps?limit=6&match=true', { credentials: 'include' }),
          fetch('/api/provider/activity?limit=20', { credentials: 'include' }),
        ]);

        if (statsRes.ok) {
          const d = await statsRes.json();
          setCredits(d.credits ?? { total: 0, utilized: 0, balance: 0 });
        }
        if (quotesRes.ok) {
          const d = await quotesRes.json();
          setProposals(d.quotes ?? []);
        }
        if (rfpRes.ok) {
          const d = await rfpRes.json();
          setRfps(d.rfps ?? []);
        }
        if (activityRes.ok) {
          const d = await activityRes.json();
          setActivities(d.activities ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch trend whenever period changes
  const fetchTrend = useCallback(async (p: Period) => {
    setTrendLoading(true);
    try {
      const res = await fetch(`/api/provider/credit-trend?period=${p}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setTrendData(d.trend ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrend(period); }, [period, fetchTrend]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const awardedCount = proposals.filter(
    p => p.status === 'accepted' || p.status === 'awarded'
  ).length;
  const utilizationPct = credits.total > 0
    ? Math.round((credits.utilized / credits.total) * 100)
    : 0;

  return (
    <DashboardShell>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 leading-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/subscribe"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-full shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Buy Credits
          </Link>
          <Link
            href="/provider/available"
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-full border border-gray-200 shadow-sm transition-colors"
          >
            <Search className="w-4 h-4" /> Browse Jobs
          </Link>
        </div>
      </div>

      <AlertBanners balance={credits.balance} />

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <MetricCard
          label="Total Available Credits"
          value={num(credits.total)}
          icon={Wallet}
        />
        <MetricCard
          label="Credits Utilized"
          value={num(credits.utilized)}
          icon={TrendingUp}
          progressPct={utilizationPct}
        />
        <MetricCard
          label="Pending Balance"
          value="$0.00"
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">

          {/* ── Job Pipeline ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-gray-900">Job Pipeline</h2>
              <Link
                href="/provider/available"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-0.5"
              >
                View all <span className="text-gray-400 ml-1">›</span>
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <PipeCard icon={Briefcase} value={rfps.length} label="Open Jobs" />
              <PipeCard icon={FileText} value={proposals.length} label="Quotes Sent" />
              <PipeCard icon={Trophy} value={awardedCount} label="Awarded" />
              <PipeCard icon={Package} value={0} label="Delivered" />
              <PipeCard icon={DollarSign} value={0} label="Paid" />
            </div>
          </div>

          {/* ── Credit Usage Trend ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Credit Usage Trend</h2>
                <p className="text-[11px] text-gray-400">Credits consumed over time</p>
              </div>

              {/* Period toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(['week', 'month'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${period === p
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {p === 'week' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[200px] relative">
              {trendLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl z-10">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!trendLoading && trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No credit usage data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="m"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="#111827"
                      strokeWidth={2.5}
                      dot={{ fill: '#111827', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Active Deliverables ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-[15px] font-bold text-gray-900">Active Deliverables</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-3 text-left   text-xs font-bold text-gray-400">Project</th>
                  <th className="px-4 py-3 text-left   text-xs font-bold text-gray-400">Client</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400">Deadline</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proposals.filter(p => p.status === 'accepted' || p.status === 'awarded').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      No active deliverables yet
                    </td>
                  </tr>
                ) : (
                  proposals
                    .filter(p => p.status === 'accepted' || p.status === 'awarded')
                    .map((p: any) => (
                      <tr key={p.proposal_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-sm">{p.project_title}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{p.buyer_name ?? '—'}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Awarded
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-500">In 10 days</td>
                        <td className="px-4 py-4 text-center">
                          <button className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center mx-auto">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Sidebar — Recent Activity ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-700" />
              <h2 className="text-[15px] font-bold text-gray-900">Recent Activity</h2>
            </div>
            {activities.length > 0 && (
              <span className="text-xs text-gray-400">Latest first</span>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No activity yet. Start by browsing jobs!
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto pr-1 -mr-1 space-y-1">
              {/* Highlight the most recent activity */}
              {activities[0] && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
                  <ActivityRow item={activities[0]} />
                  <p className="text-[10px] text-green-600 text-center mt-1">Most Recent</p>
                </div>
              )}

              {activities.slice(1).map(item => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}