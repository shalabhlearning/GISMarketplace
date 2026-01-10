// src/components/subscription/ComparisonTable.tsx
import React from 'react';
import { Check, Minus } from 'lucide-react';

const COMPARISON_DATA = [
  { feature: "Monthly Credits", starter: "50/month", prof: "200/month", ent: "500/month" },
  { feature: "Job Postings", starter: "Basic access", prof: "Unlimited", ent: "Unlimited" },
  { feature: "Quote Submissions", starter: "5/month", prof: "Unlimited", ent: "Unlimited" },
  { feature: "Reporting", starter: "Basic analytics", prof: "Advanced analytics", ent: "Full suite analytics" },
  { feature: "Dedicated Support", starter: false, prof: true, ent: true },
  { feature: "API Access", starter: false, prof: false, ent: true },
  { feature: "Team Members", starter: "1 user", prof: "Up to 5 users", ent: "Unlimited users" },
];

export default function ComparisonTable() {
  const renderCell = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="flex justify-center">
            <Check className="w-5 h-5 text-blue-500" strokeWidth={3} />
        </div>
      ) : (
        <div className="flex justify-center">
            <Minus className="w-5 h-5 text-gray-300" />
        </div>
      );
    }
    return <span className="text-center block">{val}</span>;
  };

  return (
    <div className="mt-24 mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mt-10 text-center mb-10">Detailed Plan Comparison</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-8 font-semibold text-gray-500 uppercase text-xs tracking-widest">Feature</th>
                <th className="p-8 font-bold text-gray-900 text-center">Starter</th>
                <th className="p-8 font-bold text-blue-600 text-center bg-blue-50/30">Professional</th>
                <th className="p-8 font-bold text-gray-900 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPARISON_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-6 text-gray-700 font-medium px-8">{row.feature}</td>
                  <td className="p-6 text-gray-600">{renderCell(row.starter)}</td>
                  <td className="p-6 text-gray-600 font-medium bg-blue-50/30">{renderCell(row.prof)}</td>
                  <td className="p-6 text-gray-600">{renderCell(row.ent)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50/20">
                <td className="p-8 font-bold text-gray-900">Monthly Price</td>
                <td className="p-8 font-extrabold text-gray-900 text-center text-xl">$29</td>
                <td className="p-8 font-extrabold text-blue-600 text-center text-2xl bg-blue-50/30">$99</td>
                <td className="p-8 font-extrabold text-gray-900 text-center text-xl">$249</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}