// src/components/admin/RfpTable.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'in_review' | 'open' | 'closed';

export default function RfpTable({
  onSelect,
  refreshKey = 0,
}: {
  onSelect?: (rfp: any) => void;
  refreshKey?: number;
}) {
  const router = useRouter();
  const [rfps, setRfps] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const fetchRfps = async (status: string = 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rfp/list?status=${status}`);
      const data = await res.json();
      setRfps(data.rfps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filter changes OR when refreshKey increments (after an action)
  useEffect(() => {
    fetchRfps(activeFilter);
  }, [activeFilter, refreshKey]);

  const filteredRfps = useMemo(() => rfps, [rfps]);

  // Navigate to the full detail page. Falls back to the onSelect callback
  // if a parent still relies on it for something else.
  const openRfp = (rfp: any) => {
    router.push(`/admin/rfp-review/${rfp.project_id}`);
    onSelect?.(rfp);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_review':
        return <span className="px-4 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pending Review</span>;
      case 'open':
        return <span className="px-4 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Approved</span>;
      case 'closed':
        return <span className="px-4 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-4 py-1 text-xs font-medium rounded-full bg-gray-100">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter Tabs */}
      <div className="px-8 py-5 border-b flex items-center justify-between bg-gray-50">
        <div className="flex gap-8 text-sm font-medium">
          {[
            { key: 'all', label: 'All' },
            { key: 'in_review', label: 'Pending Review' },
            { key: 'open', label: 'Approved' },
            { key: 'closed', label: 'Rejected' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key as FilterType)}
              className={`pb-1 transition-colors ${
                activeFilter === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500">{filteredRfps.length} submissions</div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400">Loading...</div>
      ) : filteredRfps.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-lg">No RFPs found</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-5 text-left font-medium">SUBMISSION ID</th>
              <th className="p-5 text-left font-medium">RFP TITLE</th>
              <th className="p-5 text-left font-medium">BUYER</th>
              <th className="p-5 text-left font-medium">DATE</th>
              <th className="p-5 text-left font-medium">STATUS</th>
              <th className="p-5 text-right pr-10 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredRfps.map((rfp: any) => (
              <tr
                key={rfp.project_id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openRfp(rfp)}
              >
                <td className="p-5 font-mono text-gray-600">{rfp.project_id?.slice(0, 8)}...</td>
                <td className="p-5">
                  <div className="font-medium text-gray-900">{rfp.title}</div>
                  <div className="text-gray-500 text-xs line-clamp-1 mt-1">{rfp.description}</div>
                </td>
                <td className="p-5 text-gray-700">{rfp.buyer_name}</td>
                <td className="p-5 text-gray-600">
                  {new Date(rfp.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="p-5">{getStatusBadge(rfp.status)}</td>
                <td className="p-5 text-right pr-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openRfp(rfp)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
                  >
                    {rfp.status === 'in_review' ? 'Review →' : 'View →'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}