'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Credits = {
  total: number;
  utilized: number;
  balance: number;
};

export default function CreditsOverview() {
  const [credits, setCredits] = useState<Credits>({
    total: 0,
    utilized: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/provider/stats', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCredits(data.credits || { total: 0, utilized: 0, balance: 0 });
      } catch (err) {
        console.error('Failed to load credits', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCredits();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading credits...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Your Credits Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Total Credits</p>
            <Wallet className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{credits.total}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Utilized Credits</p>
            <ArrowUpRight className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{credits.utilized}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Balance Credits</p>
            <ArrowDownRight className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{credits.balance}</p>
        </div>
      </div>
    </div>
  );
}