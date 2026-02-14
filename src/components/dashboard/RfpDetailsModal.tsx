// src/components/dashboard/RfpDetailsModal.tsx (Updated: navigates to propose page on "Send Quote")
'use client';

import { X, DollarSign, Calendar, Clock, User, Mail, FileText, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RfpDetailsModalProps {
  rfp: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function RfpDetailsModal({ rfp, isOpen, onClose }: RfpDetailsModalProps) {
  const router = useRouter();

  if (!isOpen || !rfp) return null;

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatDateTime = (dateTime: string | null) =>
    dateTime
      ? new Date(dateTime).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '—';

  let attachments: string[] = [];
  try {
    if (rfp.attachments) {
      attachments = JSON.parse(rfp.attachments);
    }
  } catch (e) {
    console.error('Attachments parse error:', e);
  }

  const handleSendQuote = () => {
    onClose();
    router.push(`/dashboard/provider/propose/${rfp.project_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            RFP Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Title & ID */}
          <div>
            <div className="text-3xl font-bold text-gray-900">{rfp.title || 'Untitled'}</div>
            <div className="text-sm text-gray-500 font-mono mt-2">
              Project ID: {rfp.project_id?.toUpperCase() || '—'}
            </div>
            {rfp.buyer_name && (
              <div className="text-lg text-gray-600 mt-2">by {rfp.buyer_name}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rfp.description || 'No description provided.'}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" /> Budget
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Expected Start Date
              </div>
              <div className="text-lg font-medium text-gray-900">{formatDate(rfp.start_date)}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Expected End Date
              </div>
              <div className="text-lg font-medium text-gray-900">{formatDate(rfp.end_date)}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" /> Submission Deadline
              </div>
              <div className="text-lg font-medium text-gray-900">{formatDateTime(rfp.submission_deadline)}</div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Contact Person</div>
                  <div className="font-medium text-gray-900">{rfp.contact_person || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Contact Email</div>
                  <div className="font-medium text-gray-900">{rfp.contact_email || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" /> Attachments ({attachments.length})
              </h3>
              <div className="space-y-3">
                {attachments.map((file: string, idx: number) => (
                  <a
                    key={idx}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-600 hover:underline">
                      {file.split('/').pop() || `Attachment ${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleSendQuote}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium shadow-md hover:shadow-lg transition-all"
          >
            Send Quote
          </button>
        </div>
      </div>
    </div>
  );
}