'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RfpTable({
  rfps = [],
  hasSubscription,
  isBuyer = false,
}: {
  rfps: any[];
  hasSubscription: boolean;
  isBuyer?: boolean;
}) {
  const router = useRouter();

  const handleView = (rfp: any) => {
    if (isBuyer) {
      router.push('/buyer/quote');
    } else {
      router.push(`/provider/rfp/${rfp.project_id}`);
    }
  };

  const statusCls = (s: string) =>
    s === 'open'      ? 'bg-green-100 text-green-700' :
    s === 'in_review' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100  text-gray-600';

  const statusLabel = (s: string) =>
    s === 'in_review' ? 'Under Review' :
    s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Open';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {rfps.length === 0 ? (
        <p className="text-center py-20 text-sm text-gray-400 italic">No RFPs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['RFP Details', 'Status', 'Budget', 'Date', 'Credits', 'Action'].map(h => (
                  <th
                    key={h}
                    className={`py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider
                      ${h === 'RFP Details' ? 'px-6 text-left' :
                        h === 'Action'      ? 'px-6 text-center' : 'px-4 text-center'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {rfps.map(r => (
                <tr key={r.project_id} className="hover:bg-[#f6fdf7] transition-colors">

                  {/* RFP Details */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {r.title || 'Untitled RFP'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      #{r.project_id?.slice(0, 8).toUpperCase() || '—'}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold ${statusCls(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>

                  {/* Budget */}
                  <td className="px-4 py-4 text-center text-sm font-semibold text-gray-900">
                    {r.budget ? `$${Number(r.budget).toLocaleString()}` : 'Negotiable'}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 text-center text-xs text-gray-500">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      🪙 20
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleView(r)}
                      disabled={!hasSubscription && !isBuyer}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View RFP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}