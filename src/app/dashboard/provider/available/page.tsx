// src/app/dashboard/provider/available/page.tsx (Full list with ALL fields)
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import RfpTable from '@/components/dashboard/RfpTable';

export default async function AvailableRfPsPage() {
  // FULL details for every RFP
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
  `);

  return (
    <DashboardShell title="Available RFPs">
      <div className="space-y-8">
        <div>
          <p className="mt-2 text-gray-600">
            Browse all currently open public requests for proposals ({(rfps as any[]).length} found).
          </p>
        </div>

        <RfpTable
          rfps={rfps as any[]}
          hasSubscription={true}
          isBuyer={false}
        />
      </div>
    </DashboardShell>
  );
}