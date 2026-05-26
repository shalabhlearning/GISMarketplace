'use client';

import { Eye, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import RfpDetailsModal from '../provider/RfpDetailsModal'; // Reuse the same modal
import BuyerRfpDetailsModal from './BuyerRfpDetailsModal';

export default function BuyerRfpTable({
  rfps = [],
  hasSubscription
}: {
  rfps: any[];
  hasSubscription: boolean;
}) {
  const [selectedRfp, setSelectedRfp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewRfp = (rfp: any) => {
    setSelectedRfp(rfp);
    setIsModalOpen(true);
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
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">SUBMISSION DEADLINE</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">QUOTES RECEIVED</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rfps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-gray-400 italic">
                    No RFPs created yet.
                  </td>
                </tr>
              ) : (
                rfps.map((r) => (
                  <tr key={r.project_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-medium text-gray-900">{r.title || 'Untitled RFP'}</div>
                      <div className="text-sm text-gray-500 font-mono mt-1 tracking-tight">
                        {r.project_id?.slice(0, 8).toUpperCase() || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex items-center px-5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider
                        ${r.status === 'in_review' ? 'bg-amber-600 text-white' :
                          r.status === 'open' ? 'bg-emerald-600 text-white' :
                            'bg-gray-600 text-white'}`}>
                        {r.status === 'in_review' ? 'UNDER REVIEW' : r.status?.toUpperCase() || 'OPEN'}
                      </span>
                    </td>

                    <td className="px-6 py-6 text-center font-medium text-gray-900">
                      {r.budget ? `$${Number(r.budget).toLocaleString()}` : 'Negotiable'}
                    </td>

                    <td className="px-6 py-6 text-center text-gray-600">
                      {r.submission_deadline
                        ? new Date(r.submission_deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    <td className="px-6 py-6 text-center font-medium text-gray-900">
                      {r.quotes_count || 0}
                    </td>

                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => handleViewRfp(r)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 transition-all"
                      >
                        <Eye size={17} strokeWidth={2.5} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reuse the same modal */}
      <BuyerRfpDetailsModal
        rfp={selectedRfp}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}