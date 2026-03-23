'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubscriptionAlert from '@/components/subscription/SubscriptionAlert';
import CreditsOverview from '@/components/dashboard/CreditsOverview';
import RfpTable from '@/components/provider/RfpTable';
import Link from 'next/link';

export default function Providerpage() {
  const [loading, setLoading] = useState(true);
  const [rfps, setRfps] = useState<any[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (!data.user || data.user.user_type !== 'provider') {
          window.location.assign('/');
          return;
        }

        const dashboardRes = await fetch('/api/provider/dashboard', {
          credentials: 'include',
        });

        const dashboardData = await dashboardRes.json();

        setRfps(dashboardData.rfps || []);
        setHasSubscription(dashboardData.hasSubscription);
      } catch (err) {
        console.error(err);
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
              Available RFPs
            </h2>
            <Link
              href="/ProviderAvailablepage"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
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