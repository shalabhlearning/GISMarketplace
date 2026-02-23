import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

async function getCredits() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return { total: 0, utilized: 0, balance: 0 };
  }

  const sessionRows: any[] = await query(
    `SELECT s.user_id, u.user_type 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW()`,
    [sessionToken]
  );

  if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
    return { total: 0, utilized: 0, balance: 0 };
  }

  const providerId = sessionRows[0].user_id;

  // 🔥 FIXED (no destructuring)
  const creditRows: any[] = await query(
    `SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' THEN credits ELSE 0 END), 0) AS total,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN credits ELSE 0 END), 0) AS utilized,
        COALESCE(SUM(CASE 
            WHEN type = 'credit' THEN credits 
            WHEN type = 'debit' THEN -credits 
        END), 0) AS balance
     FROM creditledger
     WHERE provider_id = ?`,
    [providerId]
  );

  return {
    total: creditRows[0]?.total ?? 0,
    utilized: creditRows[0]?.utilized ?? 0,
    balance: creditRows[0]?.balance ?? 0,
  };
}

export default async function CreditsOverview() {
  const { total, utilized, balance } = await getCredits();

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Your Credits Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Total Credits</p>
            <Wallet className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Utilized Credits</p>
            <ArrowUpRight className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{utilized}</p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Balance Credits</p>
            <ArrowDownRight className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">{balance}</p>
        </div>

      </div>
    </div>
  );
}