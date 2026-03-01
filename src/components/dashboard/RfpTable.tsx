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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">RFP Details</th>
                <th className="px-6 py-4 text-center font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">
                  {isBuyer ? 'Quotes Received' : 'Budget'}
                </th>
                <th className="px-6 py-4 text-center font-semibold">Date</th>
                <th className="px-6 py-4 text-center font-semibold">Credits Required</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 italic">
                    No RFPs found.
                  </td>
                </tr>
              ) : (
                rfps.map((r) => (
                  <tr key={r.project_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-gray-900">{r.title || 'Untitled'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {r.project_id?.slice(0, 8).toUpperCase() || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        r.status === 'open' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {r.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center font-medium text-gray-600">
                      {isBuyer ? (
                        <span className="text-blue-600">{r.quotes_count || 0} quotes</span>
                      ) : (
                        r.budget ? `$${Number(r.budget).toLocaleString()}` : 'Negotiable'
                      )}
                    </td>
                    <td className="px-6 py-5 text-center text-sm text-gray-600">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-5 text-center font-medium text-gray-600">20</td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => handleViewRfp(r)}
                        disabled={!hasSubscription && !isBuyer}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye size={16} />
                        {isBuyer ? 'View Quotes' : 'View RFP'}
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