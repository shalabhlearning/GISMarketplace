// src/app/provider/quote/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function ProviderQuotePage() {
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
          <div className="text-center py-20 text-gray-400 italic bg-white rounded-3xl border border-gray-100 shadow-sm">
            No submitted quotes found.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">PROJECT</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">CLIENT</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">TECHNICAL</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">DELIVERY</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">MILESTONES</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">SUBMITTED</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {quotes.map((q: any) => {
                    let details: any = {};
                    try {
                      const start = q.proposal_message.indexOf('{');
                      const end = q.proposal_message.lastIndexOf('}') + 1;
                      if (start !== -1) {
                        details = JSON.parse(q.proposal_message.substring(start, end));
                      }
                    } catch {}

                    const statusStyles =
                      q.status === 'accepted'
                        ? 'bg-emerald-600 text-white'
                        : q.status === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white';

                    return (
                      <tr key={q.proposal_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-medium text-gray-900">{q.project_title}</div>
                          <div className="text-sm text-gray-500 font-mono mt-1 tracking-tight">
                            {q.project_id?.slice(0, 8)?.toUpperCase()}
                          </div>
                        </td>

                        <td className="px-6 py-6 font-medium text-gray-900">
                          {q.buyer_name || '—'}
                        </td>

                        <td className="px-6 py-6 text-center font-medium text-gray-900">
                          ${Number(q.bid_amount).toLocaleString()}
                        </td>

                        <td className="px-6 py-6 text-center text-gray-600 max-w-[220px] truncate">
                          {details.technical || '—'}
                        </td>

                        <td className="px-6 py-6 text-center text-gray-600">
                          {details.delivery || '—'}
                        </td>

                        <td className="px-6 py-6 text-center font-medium text-gray-900">
                          {details.milestones?.length || 0}
                        </td>

                        <td className="px-6 py-6 text-center">
                          <span className={`inline-flex items-center px-5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider ${statusStyles}`}>
                            {q.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-6 text-center text-gray-600">
                          {new Date(q.submitted).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
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