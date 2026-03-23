'use client';

import { X, DollarSign, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuoteDetailsModalProps {
  quote: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuoteDetailsModal({ quote, isOpen, onClose }: QuoteDetailsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !quote) return null;

  let parsedMessage: any = {};
  try {
    const cleanMsg = (quote.proposal_message || '{}').trim();
    parsedMessage = JSON.parse(cleanMsg);
  } catch (e) {
    console.warn(`Proposal message parse warning for ${quote.proposal_id}`);
    parsedMessage = {};
  }

  const { technical, delivery, milestones = [], attachments = [] } = parsedMessage;

  const handleAward = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contract/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: quote.proposal_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to award contract');
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      console.error('Award error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Quote Details
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        <div className="p-8 space-y-8 text-gray-900">
          <div>
            <div className="text-3xl font-bold">{quote.provider_name} Quote for {quote.rfp_title}</div>
            <div className="text-sm font-mono mt-2 text-gray-700">
              Quote ID: QT-{quote.proposal_id.slice(0, 8).toUpperCase()}
            </div>
            <div className="mt-2 text-lg">Status: {quote.status.toUpperCase()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" /> Amount
              </div>
              <div className="text-2xl font-bold">${Number(quote.bid_amount).toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Timeline
              </div>
              <div className="text-lg font-medium">{delivery || 'N/A'}</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Technical Proposal</h3>
            <p className="whitespace-pre-wrap leading-relaxed">
              {technical || 'No technical proposal provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Milestones</h3>
            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.map((milestone: { phase: string; percentage: number }, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">{milestone.phase}</div>
                      <div className="text-sm text-gray-600">{milestone.percentage}% of total quote</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No milestones defined.</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Reference Documents</h3>
            {attachments.length > 0 ? (
              <div className="space-y-3">
                {attachments.map((file: string, idx: number) => (
                  <a
                    key={idx}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-900"
                  >
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <span className="hover:underline">
                      {file.split('/').pop() || `Document ${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No reference documents attached.</p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 font-medium transition-colors"
            >
              Close
            </button>
            {quote.status === 'submitted' && (
              <button
                onClick={handleAward}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Awarding...' : 'Award Contract'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}