// src/app/buyer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BuyerStats from '@/components/buyer/BuyerStats';
import CreateRfpHero from '@/components/buyer/CreateRfpHero';
import RfpTable from '@/components/provider/RfpTable';
import SubscriptionAlert from '@/components/subscription/SubscriptionAlert';

export default function BuyerPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [myRfps, setMyRfps] = useState<any[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (!data.user || data.user.user_type !== 'buyer') {
          window.location.assign('/');
          return;
        }

        const dashboardRes = await fetch('/api/buyer/dashboard', {
          credentials: 'include',
        });

        if (!dashboardRes.ok) throw new Error('Dashboard fetch failed');

        const dashboardData = await dashboardRes.json();

        setStats(dashboardData.stats || {});
        setMyRfps(dashboardData.rfps || []);
        setHasSubscription(dashboardData.hasSubscription || false);
      } catch (err) {
        console.error('Buyer dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) return <div className="p-8">Loading your dashboard...</div>;

  return (
    <DashboardShell title="Buyer Dashboard">
      <div className="space-y-12 px-6 py-8">
        {!hasSubscription && <SubscriptionAlert />}

        <CreateRfpHero hasSubscription={hasSubscription} />

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
          <BuyerStats
            activeRfps={stats.active_rfps ?? 0}
            quotesReceived={stats.quotes_received ?? 0}
            awarded={stats.awarded ?? 0}
            ongoing={stats.ongoing ?? 0}
            paymentsDue={7500}
          />
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My RFPs</h2>
            <p className="text-sm text-gray-500">
              {myRfps.length} RFP{myRfps.length !== 1 ? 's' : ''} created by you
            </p>
          </div>
          
          <RfpTable
            rfps={myRfps}
            hasSubscription={hasSubscription}
            isBuyer={true}
          />
        </section>
      </div>
    </DashboardShell>
  );
}