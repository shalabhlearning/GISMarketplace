'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function ProviderQuotepage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch('/api/provider/submitted-quotes', {
          credentials: 'include',
        });
        const data = await res.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        console.error('Failed to load quotes', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Submitted Quotes">
        <div className="text-center py-12">Loading your quotes...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Submitted Quotes">
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold">Submitted Quotes</h1>

        {quotes.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No submitted quotes found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-gray-900">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Project</th>
                    <th className="px-6 py-4 text-left font-semibold">Client</th>
                    <th className="px-6 py-4 text-center font-semibold">Amount</th>
                    <th className="px-6 py-4 text-center font-semibold">Technical</th>
                    <th className="px-6 py-4 text-center font-semibold">Delivery</th>
                    <th className="px-6 py-4 text-center font-semibold">Milestones</th>
                    <th className="px-6 py-4 text-center font-semibold">Status</th>
                    <th className="px-6 py-4 text-center font-semibold">Submitted</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-gray-900">
                  {quotes.map((q: any) => {
                    let details: any = {};
                    try {
                      const start = q.proposal_message.indexOf('{');
                      const end = q.proposal_message.lastIndexOf('}') + 1;
                      if (start !== -1) {
                        details = JSON.parse(q.proposal_message.substring(start, end));
                      }
                    } catch {}

                    const statusClass =
                      q.status === 'submitted'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : q.status === 'accepted'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : q.status === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200';

                    return (
                      <tr key={q.proposal_id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-5 font-medium">{q.project_title}</td>
                        <td className="px-6 py-5">{q.buyer_name || '—'}</td>
                        <td className="px-6 py-5 text-center font-medium">
                          ${Number(q.bid_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-sm max-w-[220px] truncate">
                          {details.technical || '—'}
                        </td>
                        <td className="px-6 py-5 text-sm max-w-[180px] truncate">
                          {details.delivery || '—'}
                        </td>
                        <td className="px-6 py-5 text-center text-sm">
                          {details.milestones?.length || 0}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusClass}`}
                          >
                            {q.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center text-sm">
                          {new Date(q.submitted).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}