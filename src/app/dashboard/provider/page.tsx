// src/app/dashboard/provider/page.tsx
import { redirect } from 'next/navigation';
import db from '@/lib/db'; // ← Correct: default import
import SubscriptionAlert from '@/components/dashboard/SubscriptionAlert';
import CreditsOverview from '@/components/dashboard/CreditsOverview';
import RfpTable from '@/components/dashboard/RfpTable';

// Temporary auth placeholder – replace later with real session (NextAuth, Clerk, etc.)
async function getCurrentProviderId(): Promise<string | null> {
  // In real app: get from session
  // For now, return a valid provider from your DB (change or remove in production)
  return '7e2b5874-ddc9-11f0-8727-001a7dda7113'; // Naksha Tech
}

export default async function ProviderDashboard() {
  const providerId = await getCurrentProviderId();

  if (!providerId) {
    redirect('/login');
  }

  // Fetch subscription status
  const profileRows = await db.query(
    'SELECT subscription_status FROM providerprofile WHERE provider_id = ?',
    [providerId]
  );
  const hasSubscription = (profileRows[0] as any)?.subscription_status === 'active';

  // Fetch credits
  const ledgerRows = await db.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'credit' THEN credits ELSE 0 END), 0) AS total,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN credits ELSE 0 END), 0) AS utilized
    FROM creditledger 
    WHERE provider_id = ?
  `, [providerId]);

  const credits = ledgerRows[0] as any;
  const totalCredits = Number(credits?.total || 0);
  const utilizedCredits = Number(credits?.utilized || 0);
  const balanceCredits = totalCredits - utilizedCredits;

  // Fetch open RFPs
  const rfps = await db.query(`
    SELECT 
      pr.project_id,
      pr.title,
      pr.budget,
      pr.created_at,
      bp.organization_name
    FROM projectrequest pr
    LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
    WHERE pr.status = 'open'
    ORDER BY pr.created_at DESC
    LIMIT 20
  `);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {!hasSubscription && <SubscriptionAlert />}

      <CreditsOverview
        total={totalCredits}
        utilized={utilizedCredits}
        balance={balanceCredits}
      />

      <RfpTable rfps={rfps as any[]} hasSubscription={hasSubscription} />
    </div>
  );
}