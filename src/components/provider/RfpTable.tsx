'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RfpDetailsModal from './RfpDetailsModal';

export default function RfpTable({
  rfps = [],
  hasSubscription,
  isBuyer = false
}: {
  rfps: any[];
  hasSubscription: boolean;
  isBuyer?: boolean;
}) {
  const router = useRouter();
  const [selectedRfp, setSelectedRfp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewRfp = (rfp: any) => {
    if (isBuyer) {
      router.push(`/dashboard/buyer/quotes?project_id=${rfp.project_id}`);
    } else {
      setSelectedRfp(rfp);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">RFP DETAILS</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">BUDGET</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">DATE</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">CREDITS REQUIRED</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rfps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-gray-400 italic">
                    No RFPs found.
                  </td>
                </tr>
              ) : (
                rfps.map((r) => (
                  <tr key={r.project_id} className="hover:bg-gray-50/70 transition-colors">
                    {/* RFP Details */}
                    <td className="px-8 py-6">
                      <div className="font-medium text-gray-900">{r.title || 'Untitled RFP'}</div>
                      <div className="text-sm text-gray-500 font-mono mt-1 tracking-tight">
                        {r.project_id?.slice(0, 8).toUpperCase() || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    {/* Inside RfpTable component - replace the Status column */}

                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex items-center px-5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider
    ${r.status === 'in_review' ? 'bg-amber-600 text-white' :
                          r.status === 'open' ? 'bg-emerald-600 text-white' :
                            'bg-gray-600 text-white'}`}>
                        {r.status === 'in_review' ? 'UNDER REVIEW' :
                          r.status?.toUpperCase() || 'OPEN'}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="px-6 py-6 text-center font-medium text-gray-900">
                      {r.budget ? `$${Number(r.budget).toLocaleString()}` : 'Negotiable'}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-6 text-center text-gray-600">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        : '—'}
                    </td>

                    {/* Credits Required */}
                    <td className="px-6 py-6 text-center font-medium text-gray-900">
                      20
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => handleViewRfp(r)}
                        disabled={!hasSubscription && !isBuyer}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye size={17} strokeWidth={2.5} />
                        View RFP
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RfpDetailsModal
        rfp={selectedRfp}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}