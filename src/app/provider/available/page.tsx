'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import RfpTable from '@/components/provider/RfpTable';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function ProviderAvailablePage() {
  const [rfps,     setRfps]     = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    fetch('/api/provider/available-rfps', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setRfps(d.rfps || []); setFiltered(d.rfps || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q ? rfps.filter(r =>
            r.title?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.project_id?.toLowerCase().includes(q)
          )
        : rfps
    );
  }, [search, rfps]);

  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-gray-900">Job Bidding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse open requests and submit quotes — {filtered.length} RFP{filtered.length !== 1 ? 's' : ''} available.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or ID…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 shadow-sm font-medium transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      <RfpTable rfps={filtered} hasSubscription={true} isBuyer={false} />
    </DashboardShell>
  );
}