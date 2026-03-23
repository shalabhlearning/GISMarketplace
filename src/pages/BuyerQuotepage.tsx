import type { GetServerSideProps } from 'next';
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import QuoteTable from '@/components/buyer/QuoteTable';   // ← FIXED IMPORT

export const getServerSideProps: GetServerSideProps = async (context) => {
  const sessionToken = context.req.cookies['session_token'];

  if (!sessionToken) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const sessionRows: any[] = await db.query(
    `SELECT s.user_id, u.user_type 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW()`,
    [sessionToken]
  );

  if (!sessionRows.length || sessionRows[0].user_type !== 'buyer') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const buyerId = sessionRows[0].user_id;
  const { project_id: filterProjectId } = context.query;

  let sql = `
    SELECT 
      p.proposal_id,
      p.project_id,
      p.bid_amount,
      p.proposal_message,
      p.status,
      p.credits_used,
      p.created_at as submitted,
      pr.title as rfp_title,
      u.email as provider_name
    FROM proposal p
    JOIN projectrequest pr ON p.project_id = pr.project_id
    JOIN user u ON p.provider_id = u.user_id
    WHERE pr.buyer_id = ?
      ${filterProjectId ? 'AND p.project_id = ?' : ''}
    ORDER BY p.created_at DESC
  `;

  const params = filterProjectId ? [buyerId, filterProjectId] : [buyerId];
  const quotes = await db.query(sql, params);

  return {
    props: {
      quotes: JSON.parse(JSON.stringify(quotes)),
    },
  };
};

export default function BuyerQuotepage({ quotes }: { quotes: any[] }) {
  return (
    <DashboardShell title="Received Quotes">
      <QuoteTable quotes={quotes} />
    </DashboardShell>
  );
}