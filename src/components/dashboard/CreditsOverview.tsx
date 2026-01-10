import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function CreditsOverview({ total = 0, utilized = 0, balance = 0 }: { total?: number; utilized?: number; balance?: number }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Credits Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Total Credits</p>
            <Wallet className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Utilized Credits</p>
            <ArrowUpRight className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{utilized}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Balance Credits</p>
            <ArrowDownRight className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{balance}</p>
        </div>
      </div>
    </div>
  );
}