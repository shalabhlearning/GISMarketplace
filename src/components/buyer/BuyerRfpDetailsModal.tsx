'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Upload, DollarSign, Calendar, Clock, User, Mail } from 'lucide-react';

interface BuyerRfpDetailsModalProps {
  rfp: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyerRfpDetailsModal({ rfp, isOpen, onClose }: BuyerRfpDetailsModalProps) {
  // Reset state when RFP changes (mirrors RfpDetailsModal pattern)
  useEffect(() => {
    // nothing to reset now, but kept for future safety
  }, [rfp?.project_id]);

  if (!isOpen || !rfp) return null;

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';

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

  // ✅ Fixed: mirrors the robust parse from RfpDetailsModal
  let attachments: string[] = [];
  if (rfp.attachments) {
    try {
      attachments =
        typeof rfp.attachments === 'string'
          ? JSON.parse(rfp.attachments)
          : Array.isArray(rfp.attachments)
          ? rfp.attachments
          : [];
    } catch (e) {
      console.error('Attachments parse error:', e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-8 py-5 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-blue-600" /> RFP Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8 text-gray-900">

          {/* Title + Project ID */}
          <div>
            <div className="text-3xl font-bold">{rfp.title || 'Untitled RFP'}</div>
            <div className="text-sm font-mono mt-2 text-gray-700">
              Project ID: {rfp.project_id?.toUpperCase() || '—'}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {rfp.description || 'No description provided.'}
            </p>
          </div>

          {/* Budget + Dates — ✅ same grid layout as working provider modal */}
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
              {/* ✅ was missing text-lg font-medium wrapper in original */}
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

          {/* Contact Information — ✅ now uses same structure as provider modal */}
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

          {/* Attachments */}
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
        </div>

        {/* Footer — ✅ Close only, no AI Analyze or Send Quote */}
        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}