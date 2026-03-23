'use client';

import { useEffect, useState } from 'react';

type Stats = {
  activeServices: number;
  openProposals: number;
  creditsBalance: number;
};

export default function ProviderStats() {
  const [stats, setStats] = useState<Stats>({
    activeServices: 0,
    openProposals: 0,
    creditsBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/provider/stats', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(data.stats || stats);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Active Services" value={stats.activeServices.toString()} />
      <StatCard title="Open Proposals" value={stats.openProposals.toString()} />
      <StatCard title="Credits Balance" value={stats.creditsBalance.toString()} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-xs uppercase text-gray-500 tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}