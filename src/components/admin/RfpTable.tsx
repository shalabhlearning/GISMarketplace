// src/components/admin/RfpTable.tsx
export default function RfpTable({ rfps, onSelect }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-8 py-5 border-b flex items-center justify-between bg-gray-50">
        <div className="flex gap-8 text-sm font-medium">
          <span className="text-blue-600 border-b-2 border-blue-600 pb-1">All</span>
          <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Pending Review</span>
          <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Approved</span>
          <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Rejected</span>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          Sort by: Newest <span className="text-xs">▼</span>
        </div>
      </div>

      {rfps.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-lg">
          No RFPs in review queue
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-5 text-left font-medium">SUBMISSION ID</th>
              <th className="p-5 text-left font-medium">RFP TITLE & CONTEXT</th>
              <th className="p-5 text-left font-medium">BUYER</th>
              <th className="p-5 text-left font-medium">DATE</th>
              <th className="p-5 text-left font-medium">STATUS</th>
              <th className="p-5 text-right pr-10 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {rfps.map((rfp: any) => (
              <tr key={rfp.project_id} className="hover:bg-gray-50 transition-colors">
                <td className="p-5 font-mono text-gray-600">{rfp.project_id.slice(0, 8)}...</td>
                <td className="p-5">
                  <div className="font-medium text-gray-900">{rfp.title}</div>
                  <div className="text-gray-500 text-xs line-clamp-1 mt-1">{rfp.description}</div>
                </td>
                <td className="p-5 text-gray-700">{rfp.buyer_name}</td>
                <td className="p-5 text-gray-600">
                  {new Date(rfp.created_at).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </td>
                <td className="p-5">
                  <span className="px-4 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                    Pending
                  </span>
                </td>
                <td className="p-5 text-right pr-10">
                  <button
                    onClick={() => onSelect(rfp)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
                  >
                    Review <span>→</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}