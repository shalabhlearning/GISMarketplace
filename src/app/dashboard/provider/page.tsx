// src/app/dashboard/provider/page.tsx (Updated query to include ALL RFP fields for modal)
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert';
import CreditsOverview from '@/components/dashboard/CreditsOverview';
import RfpTable from '@/components/dashboard/RfpTable';
import Link from 'next/link';

export default async function ProviderDashboard() {
  const hasSubscription = true; // Your real logic
  const totalCredits = 100;
  const utilizedCredits = 20;
  const balanceCredits = totalCredits - utilizedCredits;

  // FULL RFP details now fetched
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

  return (
    <DashboardShell title="Provider Dashboard">
      <div className="space-y-12">
        {!hasSubscription && <SubscriptionAlert />}

        <CreditsOverview
          total={totalCredits}
          utilized={utilizedCredits}
          balance={balanceCredits}
        />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Available RFPs</h2>
            <Link
              href="/dashboard/provider/available"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
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