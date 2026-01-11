import { redirect } from 'next/navigation';
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BuyerStats from '@/components/dashboard/BuyerStats';
import CreateRfpHero from '@/components/dashboard/CreateRfpHero';
import RfpTable from '@/components/dashboard/RfpTable';
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert';

async function getCurrentBuyerId() {
  // ← TODO: real session/auth later
  return '7e2b5874-ddc9-11f0-8727-001a7dda7113';
}

export default async function BuyerDashboard() {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect('/login');

  // ── Subscription check ───────────────────────────────────────
  const subCheck = await db.query(
    `SELECT subscription_status 
     FROM buyerprofile 
     WHERE buyer_id = ?`,
    [buyerId]
  );

  const hasSubscription = (subCheck?.[0] as any)?.subscription_status === 'active';

  // ── Stats ─────────────────────────────────────────────────────
  const statsRows = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM projectrequest WHERE buyer_id = ? AND status = 'open')           as active_rfps,
      (SELECT COUNT(*) FROM proposal p 
       JOIN projectrequest pr ON p.project_id = pr.project_id 
       WHERE pr.buyer_id = ?)                                                            as quotes_received,
      (SELECT COUNT(*) FROM projectrequest WHERE buyer_id = ? AND status = 'contracted')  as awarded,
      (SELECT COUNT(*) FROM contract c 
       JOIN proposal p ON c.proposal_id = p.proposal_id 
       JOIN projectrequest pr ON p.project_id = pr.project_id 
       WHERE pr.buyer_id = ? AND c.status = 'in_progress')                               as ongoing
    `,
    [buyerId, buyerId, buyerId, buyerId]
  );

  const stats = (statsRows?.[0] || {}) as any;

  // ── Recent RFPs ───────────────────────────────────────────────
  const rfps = await db.query(`
    SELECT 
        project_id, 
        title, 
        status, 
        created_at,
        (SELECT COUNT(*) FROM proposal WHERE project_id = pr.project_id) as quotes_count
    FROM projectrequest pr
    WHERE buyer_id = ?
    ORDER BY created_at DESC 
    LIMIT 5
  `, [buyerId]);

  return (
    <DashboardShell title="Buyer Dashboard">
      <div className="space-y-12">

        {!hasSubscription && <SubscriptionAlert />}

        {/* Hero / Call to Action */}
        <CreateRfpHero hasSubscription={hasSubscription} />

        {/* Statistics */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
          <BuyerStats
            activeRfps={stats.active_rfps ?? 0}
            quotesReceived={stats.quotes_received ?? 0}
            awarded={stats.awarded ?? 0}
            ongoing={stats.ongoing ?? 0}
            paymentsDue={7500} // ← can come from DB later
          />
        </section>

        {/* Recent RFPs */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent RFPs</h2>
            <a
              href="/dashboard/buyer/projects"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All →
            </a>
          </div>

          <RfpTable
            rfps={rfps as any[]}
            hasSubscription={hasSubscription}
            isBuyer={true}
          />
        </section>
      </div>
    </DashboardShell>
  );
}