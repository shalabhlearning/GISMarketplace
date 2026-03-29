'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import QuoteDetailsModal from './QuoteDetailsModal';

interface Quote {
  proposal_id: string;
  project_id: string;
  bid_amount: number;
  proposal_message: string;
  status: string;
  credits_used: number;
  submitted: string;
  rfp_title: string;
  provider_name: string;
}

interface QuoteTableProps {
  quotes: Quote[];
}

export default function QuoteTable({ quotes = [] }: QuoteTableProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">RFP DETAILS</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">PROVIDER</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">AMOUNT</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">TIMELINE</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">DOCS</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">SUBMITTED</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-gray-400 italic">
                    No quotes received yet.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  let parsedMessage: any = {};
                  try {
                    parsedMessage = JSON.parse((q.proposal_message || '{}').trim());
                  } catch {}

                  const timeline = parsedMessage.delivery || 'N/A';
                  const docsCount = parsedMessage.attachments?.length || 0;

                  const statusStyles =
                    q.status === 'accepted'
                      ? 'bg-emerald-600 text-white'
                      : q.status === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white';

                  return (
                    <tr key={q.proposal_id} className="hover:bg-gray-50/70 transition-colors">
                      
                      {/* RFP */}
                      <td className="px-8 py-6">
                        <div className="font-medium text-gray-900">{q.rfp_title}</div>
                        <div className="text-sm text-gray-500 font-mono mt-1 tracking-tight">
                          {q.project_id?.slice(0, 8).toUpperCase()}
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-medium">
                            {q.provider_name?.[0] || '?'}
                          </div>
                          <div className="font-medium text-gray-900">{q.provider_name}</div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-6 text-center font-medium text-gray-900">
                        ${Number(q.bid_amount).toLocaleString()}
                      </td>

                      {/* Timeline */}
                      <td className="px-6 py-6 text-center text-gray-600">
                        {timeline}
                      </td>

                      {/* Docs */}
                      <td className="px-6 py-6 text-center font-medium text-gray-900">
                        {docsCount}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-6 text-center">
                        <span className={`inline-flex items-center px-5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider ${statusStyles}`}>
                          {q.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-6 text-center text-gray-600">
                        {new Date(q.submitted).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => handleViewQuote(q)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 transition-all"
                        >
                          <Eye size={17} strokeWidth={2.5} />
                          View Quote
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuoteDetailsModal
        quote={selectedQuote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}