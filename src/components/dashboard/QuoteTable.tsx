'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Quote ID</th>
                <th className="px-6 py-4 text-left font-semibold">Provider</th>
                <th className="px-6 py-4 text-center font-semibold">Amount</th>
                <th className="px-6 py-4 text-center font-semibold">Timeline</th>
                <th className="px-6 py-4 text-center font-semibold">Docs</th>
                <th className="px-6 py-4 text-center font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Submitted</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 italic">
                    No quotes received yet.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  let parsedMessage;
                  try {
                    parsedMessage = JSON.parse(q.proposal_message);
                  } catch (e) {
                    console.error('Proposal message parse error:', e);
                    parsedMessage = {};
                  }

                  const timeline = parsedMessage.delivery || 'N/A';
                  const docsCount = parsedMessage.attachments ? parsedMessage.attachments.length : 0;

                  return (
                    <tr key={q.proposal_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5 text-left">
                        <div className="font-mono text-sm text-gray-700">
                          QT-{q.proposal_id.slice(0, 4).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                            {q.provider_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{q.provider_name}</div>
                            <div className="text-sm text-gray-600">{q.rfp_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-medium text-gray-900">
                        ${Number(q.bid_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-center text-gray-600">
                        {timeline}
                      </td>
                      <td className="px-6 py-5 text-center text-gray-600">
                        {docsCount}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          q.status === 'submitted' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : q.status === 'accepted' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {q.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center text-sm text-gray-600">
                        {new Date(q.submitted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleViewQuote(q)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                        >
                          View Detail
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