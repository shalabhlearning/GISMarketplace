import { query } from '@/lib/db';
import { cookies } from 'next/headers';

async function getProviderStats() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return { activeServices: 0, openProposals: 0, creditsBalance: 0 };
  }

  const sessionRows: any[] = await query(
    `SELECT s.user_id, u.user_type 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW()`,
    [sessionToken]
  );

  if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
    return { activeServices: 0, openProposals: 0, creditsBalance: 0 };
  }

  const providerId = sessionRows[0].user_id;

  // 🔥 FIXED (no destructuring)
  const statsRows: any[] = await query(
    `SELECT 
       (SELECT COUNT(*) FROM servicelisting 
        WHERE provider_id = ? AND status = 'active') AS active_services,

       (SELECT COUNT(*) FROM proposal 
        WHERE provider_id = ? AND status = 'submitted') AS open_proposals,

       (SELECT COALESCE(SUM(
            CASE 
                WHEN type = 'credit' THEN credits 
                WHEN type = 'debit' THEN -credits 
            END
        ), 0)
        FROM creditledger 
        WHERE provider_id = ?) AS credits_balance
     `,
    [providerId, providerId, providerId]
  );

  return {
    activeServices: statsRows[0]?.active_services ?? 0,
    openProposals: statsRows[0]?.open_proposals ?? 0,
    creditsBalance: statsRows[0]?.credits_balance ?? 0,
  };
}

export default async function ProviderStats() {
  const { activeServices, openProposals, creditsBalance } =
    await getProviderStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Active Services" value={activeServices.toString()} />
      <StatCard title="Open Proposals" value={openProposals.toString()} />
      <StatCard title="Credits Balance" value={creditsBalance.toString()} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-xs uppercase text-gray-500 tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}