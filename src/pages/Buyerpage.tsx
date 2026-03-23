'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BuyerStats from '@/components/buyer/BuyerStats';
import CreateRfpHero from '@/components/buyer/CreateRfpHero';
import RfpTable from '@/components/provider/RfpTable';
import SubscriptionAlert from '@/components/subscription/SubscriptionAlert';

export default function Buyerpage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [rfps, setRfps] = useState<any[]>([]);
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

        setUser(data.user);

        // fetch dashboard data
        const dashboardRes = await fetch('/api/buyer/dashboard', {
          credentials: 'include',
        });

        const dashboardData = await dashboardRes.json();

        setStats(dashboardData.stats || {});
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
    <DashboardShell title="Buyer Dashboard">
      <div className="space-y-12">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent RFPs</h2>
          <RfpTable
            rfps={rfps}
            hasSubscription={hasSubscription}
            isBuyer={true}
          />
        </section>
      </div>
    </DashboardShell>
  );
}