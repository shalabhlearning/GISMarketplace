'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function ProviderQuotePage() {
  const [quotes,  setQuotes]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/provider/submitted-quotes', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setQuotes(d.quotes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusCls = (s: string) =>
    s === 'accepted' ? 'bg-green-100 text-green-700' :
    s === 'rejected' ? 'bg-red-100   text-red-600'   :
                       'bg-blue-100  text-blue-700';

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
        <h1 className="text-[26px] font-bold text-gray-900">Submitted Quotes</h1>
        <p className="text-sm text-gray-500 mt-1">Track all quotes you've submitted to buyers.</p>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-24 text-center">
          <p className="text-gray-400 text-sm italic">No submitted quotes found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Project', 'Client', 'Amount', 'Technical', 'Delivery', 'Milestones', 'Status', 'Submitted'].map(h => (
                    <th
                      key={h}
                      className={`py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider
                        ${h === 'Project' ? 'px-6 text-left' : 'px-4 text-center'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {quotes.map((q: any) => {
                  // Parse proposal_message JSON details (same as original)
                  let details: any = {};
                  try {
                    const start = q.proposal_message?.indexOf('{');
                    const end   = q.proposal_message?.lastIndexOf('}') + 1;
                    if (start !== -1) {
                      details = JSON.parse(q.proposal_message.substring(start, end));
                    }
                  } catch {}

                  return (
                    <tr key={q.proposal_id} className="hover:bg-[#f6fdf7] transition-colors">

                      {/* Project */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{q.project_title}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          #{q.project_id?.slice(0, 8)?.toUpperCase()}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-4 text-center text-sm text-gray-700 font-medium">
                        {q.buyer_name || '—'}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                        ${Number(q.bid_amount).toLocaleString()}
                      </td>

                      {/* Technical */}
                      <td className="px-4 py-4 text-center text-xs text-gray-500 max-w-[180px] truncate">
                        {details.technical || '—'}
                      </td>

                      {/* Delivery */}
                      <td className="px-4 py-4 text-center text-xs text-gray-500">
                        {details.delivery || '—'}
                      </td>

                      {/* Milestones */}
                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">
                        {details.milestones?.length || 0}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold ${statusCls(q.status)}`}>
                          {q.status?.charAt(0).toUpperCase() + q.status?.slice(1)}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-4 text-center text-xs text-gray-500">
                        {new Date(q.submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}