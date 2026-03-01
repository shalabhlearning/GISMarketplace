// src/app/dashboard/provider/available/page.tsx
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import RfpTable from '@/components/dashboard/RfpTable';
import { cookies } from 'next/headers';

export default async function AvailableRfPsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  let providerId: string | null = null;
  if (sessionToken) {
    const rows: any[] = await db.query(
      `SELECT s.user_id 
       FROM sessions s 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );
    providerId = rows[0]?.user_id || null;
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
    WHERE pr.status = 'open' 
      AND pr.visibility = 'public'
      ${providerId ? `AND NOT EXISTS (
        SELECT 1 FROM proposal 
        WHERE project_id = pr.project_id 
          AND provider_id = ?
      )` : ''}
    ORDER BY pr.created_at DESC
  `, providerId ? [providerId] : []);

  return (
    <DashboardShell title="Available RFPs">
      <div className="space-y-8">
        <div>
          <p className="mt-2 text-gray-600">
            Browse all currently open public requests for proposals ({(rfps as any[]).length} found).
            {providerId && <span className="text-green-600 ml-2">— Only RFPs you haven’t quoted on yet</span>}
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