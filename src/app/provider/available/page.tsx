// src/app/provider/available/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import RfpTable from '@/components/provider/RfpTable';

export default function ProviderAvailablePage() {
  const [rfps, setRfps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailableRfps() {
      try {
        const res = await fetch('/api/provider/available-rfps', {
          credentials: 'include',
        });
        const data = await res.json();
        setRfps(data.rfps || []);
      } catch (err) {
        console.error('Failed to load available RFPs', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableRfps();
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Available RFPs">
        <div className="text-center py-12">Loading available RFPs...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Available RFPs">
      <div className="space-y-8">
        <div>
          <p className="mt-2 text-gray-600">
            Browse all currently open public requests for proposals ({rfps.length} found).
          </p>
        </div>

        <RfpTable
          rfps={rfps}
          hasSubscription={true}
          isBuyer={false}
        />
      </div>
    </DashboardShell>
  );
}