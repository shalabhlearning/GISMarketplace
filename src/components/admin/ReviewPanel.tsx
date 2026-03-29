export default function ReviewPanel({ rfp, onClose, onAction }: any) {
  const attachments = rfp.attachments
    ? typeof rfp.attachments === 'string'
      ? JSON.parse(rfp.attachments)
      : rfp.attachments
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-blue-700 text-white px-8 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">
              Review Submission: {rfp.project_id}
            </div>
            <div className="text-sm opacity-90">
              Submitted by {rfp.buyer_name} on{" "}
              {new Date(rfp.created_at).toLocaleDateString()}
            </div>
          </div>
          <button onClick={onClose} className="text-3xl hover:text-gray-200">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT SIDE */}
          <div className="flex-1 p-8 overflow-y-auto">

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {rfp.title}
            </h2>

            <p className="text-gray-800 leading-relaxed mb-6">
              {rfp.description || "No description provided."}
            </p>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-8 mt-6">

              <div>
                <h3 className="font-semibold mb-4 text-gray-900">
                  📅 TIMELINE EXPECTATIONS
                </h3>

                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Project Start</span>
                    <span>
                      {rfp.start_date
                        ? new Date(rfp.start_date).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Submission Deadline</span>
                    <span>
                      {rfp.submission_deadline
                        ? new Date(rfp.submission_deadline).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Project End</span>
                    <span>
                      {rfp.end_date
                        ? new Date(rfp.end_date).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">
                  💰 FINANCIALS
                </h3>

                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Budget</span>
                    <span className="font-semibold text-blue-700">
                      ₹{rfp.budget || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mt-10">
              <h3 className="font-semibold mb-4 text-gray-900">
                📎 ATTACHMENTS
              </h3>

              {attachments.length === 0 ? (
                <p className="text-gray-600 text-sm">No attachments</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((file: string, idx: number) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      className="border rounded-xl p-4 flex items-center gap-3 hover:bg-gray-100 cursor-pointer"
                    >
                      <div>📄</div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {file.split('/').pop()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Click to view
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-96 border-l bg-gray-100 p-6 flex flex-col">

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-900">
                📋 Audit Notes
              </h3>

              <div className="bg-white p-4 rounded-xl text-sm text-gray-800">
                System Validation Passed
                <div className="text-xs text-gray-500 mt-2">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">

              <button
                onClick={() => onAction(rfp.project_id, 'approve')}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl"
              >
                Approve & Post
              </button>

              <button
                onClick={() => onAction(rfp.project_id, 'changes')}
                className="w-full border border-gray-400 hover:bg-gray-200 text-gray-900 font-medium py-3.5 rounded-xl"
              >
                Request Changes
              </button>

              <button
                onClick={() => onAction(rfp.project_id, 'reject')}
                className="w-full text-red-700 hover:bg-red-100 font-medium py-3.5 rounded-xl border border-red-300"
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}