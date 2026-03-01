import { redirect } from 'next/navigation';
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import QuoteTable from '@/components/dashboard/QuoteTable';
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

export default async function ReceivedQuotesPage({
  searchParams,
}: {
  searchParams: { project_id?: string };
}) {
  const user = await getCurrentUser();
  if (!user || user.type !== 'buyer') redirect('/login');

  const buyerId = user.id;
  const filterProjectId = searchParams.project_id;

  let sql = `
    SELECT 
      p.proposal_id,
      p.project_id,
      p.bid_amount,
      p.proposal_message,
      p.status,
      p.credits_used,
      p.created_at AS submitted,
      pr.title AS rfp_title,
      pp.organization_name AS provider_name
    FROM proposal p
    JOIN projectrequest pr ON p.project_id = pr.project_id
    JOIN providerprofile pp ON p.provider_id = pp.provider_id
    WHERE pr.buyer_id = ?
  `;
  const params: any[] = [buyerId];

  if (filterProjectId) {
    sql += ` AND p.project_id = ?`;
    params.push(filterProjectId);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const quotes = await db.query(sql, params);

  return (
    <DashboardShell title="Received Quotes">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Received Vendor Quotes</h2>
          <p className="text-gray-600">
            {filterProjectId ? "Quotes for this specific RFP" : "Compare vendor proposals and select the best fit for your requirements."}
          </p>
        </div>

        <QuoteTable quotes={quotes as any[]} />
      </div>
    </DashboardShell>
  );
}