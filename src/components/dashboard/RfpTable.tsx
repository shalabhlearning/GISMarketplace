import { Eye } from 'lucide-react';

export default function RfpTable({ 
  rfps = [], 
  hasSubscription, 
  isBuyer = false 
}: { 
  rfps: any[]; 
  hasSubscription: boolean;
  isBuyer?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">RFP Details</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">
                {isBuyer ? 'Quotes Received' : 'Budget'}
              </th>
              <th className="px-6 py-4 text-center font-semibold">Date</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rfps && rfps.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 italic">
                  No RFPs found.
                </td>
              </tr>
            ) : (
              rfps.map((r, index) => (
                <tr key={r?.project_id || index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{r?.title || 'Untitled Project'}</div>
                    <div className="text-xs text-gray-400 uppercase font-mono">
                      {/* Fixed the .slice() error by using optional chaining and fallback */}
                      {r?.project_id ? r.project_id.slice(0, 8) : 'REF-PENDING'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r?.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isBuyer ? (
                      <span className="font-bold text-blue-600">{r?.quotes_count || 0} Quotes</span>
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {r?.budget ? `$${Number(r.budget).toLocaleString()}` : 'Negotiable'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {r?.created_at ? new Date(r.created_at).toLocaleDateString() : '---'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      disabled={!hasSubscription && !isBuyer}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <Eye size={16} className="text-gray-400" />
                      {isBuyer ? 'View Quotes' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}