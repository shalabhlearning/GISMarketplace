// src/app/provider/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubscriptionAlert from '@/components/subscription/SubscriptionAlert';
import CreditsOverview from '@/components/dashboard/CreditsOverview';
import RfpTable from '@/components/provider/RfpTable';
import Link from 'next/link';

export default function ProviderPage() {
  const [loading, setLoading] = useState(true);
  const [rfps, setRfps] = useState<any[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const userData = await res.json();

        if (!userData.user || userData.user.user_type !== 'provider') {
          window.location.assign('/');
          return;
        }

        const dashboardRes = await fetch('/api/provider/dashboard', {
          credentials: 'include',
        });

        const dashboardData = await dashboardRes.json();

        console.log("Dashboard API Response:", dashboardData);   // ← Check this in browser console

        setRfps(dashboardData.rfps || []);
        setHasSubscription(dashboardData.hasSubscription || false);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <DashboardShell title="Provider Dashboard">
      <div className="space-y-12">
        {!hasSubscription && <SubscriptionAlert />}

        <CreditsOverview />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Latest Available RFPs
            </h2>
            <Link
              href="/provider/available"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <span aria-hidden="true">→</span>
            </Link>
          </div>

          <RfpTable
            rfps={rfps}
            hasSubscription={hasSubscription}
            isBuyer={false}
          />
        </section>
      </div>
    </DashboardShell>
  );
}