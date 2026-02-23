export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import { cookies } from 'next/headers';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert';
import CreditsOverview from '@/components/dashboard/CreditsOverview';
import RfpTable from '@/components/dashboard/RfpTable';
import Link from 'next/link';

export default async function ProviderDashboard() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return <div>Unauthorized</div>;
  }

  const sessionRows: any[] = await db.query(
    `SELECT s.user_id, u.user_type 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW()`,
    [sessionToken]
  );

  if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
    return <div>Unauthorized</div>;
  }

  const rfps = await db.query(`
    SELECT 
      pr.project_id,
      pr.title,
      pr.description,
      pr.status,
      pr.budget,
      pr.start_date,
      pr.end_date,
      pr.submission_deadline,
      pr.contact_person,
      pr.contact_email,
      pr.attachments,
      pr.created_at,
      bp.organization_name AS buyer_name
    FROM projectrequest pr
    LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
    WHERE pr.status = 'open' AND pr.visibility = 'public'
    ORDER BY pr.created_at DESC
    LIMIT 8
  `);

  const hasSubscription = true;

  return (
    <DashboardShell title="Provider Dashboard">
      <div className="space-y-12">
        {!hasSubscription && <SubscriptionAlert />}

        {/* CreditsOverview now calculates its own values */}
        <CreditsOverview />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Available RFPs
            </h2>
            <Link
              href="/dashboard/provider/available"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>

          <RfpTable
            rfps={rfps as any[]}
            hasSubscription={hasSubscription}
            isBuyer={false}
          />
        </section>
      </div>
    </DashboardShell>
  );
}