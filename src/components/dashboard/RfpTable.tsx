// src/components/dashboard/RfpTable.tsx
import { Eye } from 'lucide-react';

export default function RfpTable({ rfps = [], hasSubscription }: { rfps: any[]; hasSubscription: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available RFP Open for Quote</h2>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-8 py-4 text-left font-medium">RFP ID</th>
                <th className="px-8 py-4 text-left font-medium">Title</th>
                <th className="px-8 py-4 text-left font-medium">Client</th>
                <th className="px-8 py-4 text-center font-medium">Budget</th>
                <th className="px-8 py-4 text-center font-medium">Deadline</th>
                <th className="px-8 py-4 text-center font-medium">Credits</th>
                <th className="px-8 py-4 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500 text-lg">
                    No open RFPs at the moment.
                  </td>
                </tr>
              ) : (
                rfps.map((r) => {
                  // Safety: skip if row is invalid
                  if (!r || !r.project_id) return null;

                  return (
                    <tr key={r.project_id} className="hover:bg-blue-50/30 transition">
                      <td className="px-8 py-5 font-medium text-gray-900">
                        {r.project_id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-8 py-5 text-gray-800">
                        {r.title || 'Untitled Project'}
                      </td>
                      <td className="px-8 py-5 text-gray-700">
                        {r.organization_name || 'Unknown Client'}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {r.budget
                          ? `$${Number(r.budget).toLocaleString()} - $${(Number(r.budget) * 1.6).toLocaleString()}`
                          : 'Negotiable'}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-8 py-5 text-center font-semibold text-blue-600">
                        {Math.floor(Math.random() * 6) + 1}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button
                          disabled={!hasSubscription}
                          className={`flex items-center gap-2 mx-auto px-6 py-2.5 rounded-lg font-medium transition ${
                            hasSubscription
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          Submit Quote
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
    </div>
  );
}