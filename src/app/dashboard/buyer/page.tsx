import { redirect } from 'next/navigation';
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BuyerStats from '@/components/dashboard/BuyerStats';
import CreateRfpHero from '@/components/dashboard/CreateRfpHero';
import RfpTable from '@/components/dashboard/RfpTable';
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;

  const sessionRows: any[] = await db.query(
    `SELECT s.user_id, u.user_type 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW()`,
    [sessionToken]
  );

  if (!sessionRows.length) return null;

  return { id: sessionRows[0].user_id, type: sessionRows[0].user_type };
}

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.type !== 'buyer') redirect('/login');

  const buyerId = user.id;

  // Subscription check
  const subCheck = await db.query(
    `SELECT subscription_status FROM buyerprofile WHERE buyer_id = ?`,
    [buyerId]
  );
  const hasSubscription = (subCheck?.[0] as any)?.subscription_status === 'active';

  // Stats (your existing query - kept as is)
  const statsRows = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM projectrequest WHERE buyer_id = ? AND status = 'open')           as active_rfps,
      (SELECT COUNT(*) FROM proposal p JOIN projectrequest pr ON p.project_id = pr.project_id WHERE pr.buyer_id = ?) as quotes_received,
      (SELECT COUNT(*) FROM projectrequest WHERE buyer_id = ? AND status = 'contracted')  as awarded,
      (SELECT COUNT(*) FROM contract c JOIN proposal p ON c.proposal_id = p.proposal_id JOIN projectrequest pr ON p.project_id = pr.project_id WHERE pr.buyer_id = ? AND c.status = 'in_progress') as ongoing
    `,
    [buyerId, buyerId, buyerId, buyerId]
  );
  const stats = (statsRows?.[0] || {}) as any;

  // Recent RFPs – now using consistent field names
  const rfps = await db.query(`
    SELECT 
      project_id, 
      title, 
      status, 
      created_at,
      budget,
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent RFPs</h2>
            <Link
              href="/dashboard/buyer/projects" // ← change if you have a full list page
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All →
            </Link>
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