'use client';

import { useRouter } from 'next/navigation';
import { X, DollarSign, Calendar, Clock, User, Mail, FileText, Upload } from 'lucide-react';

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

  // Safe attachments parsing
  let attachments: string[] = [];
  if (rfp.attachments) {
    if (typeof rfp.attachments === 'string') {
      try {
        attachments = JSON.parse(rfp.attachments);
      } catch (e) {
        console.error('Attachments parse error:', e);
      }
    } else if (Array.isArray(rfp.attachments)) {
      attachments = rfp.attachments;
    }
  }

  const handleSendQuote = () => {
    onClose();
    router.push(`/propose/${rfp.project_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            RFP Details
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        <div className="p-8 space-y-8 text-gray-900">
          <div>
            <div className="text-3xl font-bold">{rfp.title || 'Untitled'}</div>
            <div className="text-sm font-mono mt-2 text-gray-700">
              Project ID: {rfp.project_id?.toUpperCase() || '—'}
            </div>
            {rfp.buyer_name && <div className="text-lg mt-2">by {rfp.buyer_name}</div>}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="whitespace-pre-wrap leading-relaxed">
              {rfp.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" /> Budget
              </div>
              <div className="text-2xl font-bold">
                {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Start Date
              </div>
              <div className="text-lg font-medium">{formatDate(rfp.start_date)}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" /> End Date
              </div>
              <div className="text-lg font-medium">{formatDate(rfp.end_date)}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <div className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" /> Submission Deadline
              </div>
              <div className="text-lg font-medium">{formatDateTime(rfp.submission_deadline)}</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-700" />
                <div>
                  <div className="text-sm text-gray-700">Contact Person</div>
                  <div className="font-medium text-gray-900">{rfp.contact_person || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-700" />
                <div>
                  <div className="text-sm text-gray-700">Contact Email</div>
                  <div className="font-medium text-gray-900">{rfp.contact_email || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" /> Attachments ({attachments.length})
              </h3>
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
                      {file.split('/').pop() || `Attachment ${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSendQuote}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md transition-all"
            >
              Send Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}