// src/app/api/provider/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({
        credits: { total: 0, utilized: 0, balance: 0 },
        stats: { activeServices: 0, openProposals: 0, creditsBalance: 0 },
      });
    }

    // Get user & verify provider
    const sessionRows: any[] = await query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
      return NextResponse.json({
        credits: { total: 0, utilized: 0, balance: 0 },
        stats: { activeServices: 0, openProposals: 0, creditsBalance: 0 },
      });
    }

    const providerId = sessionRows[0].user_id;

    // Credits Ledger
    const creditRows: any[] = await query(
      `SELECT 
          COALESCE(SUM(CASE WHEN type = 'credit' THEN credits ELSE 0 END), 0) AS total,
          COALESCE(SUM(CASE WHEN type = 'debit' THEN credits ELSE 0 END), 0) AS utilized,
          COALESCE(SUM(CASE WHEN type = 'credit' THEN credits 
                            WHEN type = 'debit' THEN -credits END), 0) AS balance
       FROM creditledger
       WHERE provider_id = ?`,
      [providerId]
    );

    const credits = {
      total: creditRows[0]?.total ?? 0,
      utilized: creditRows[0]?.utilized ?? 0,
      balance: creditRows[0]?.balance ?? 0,
    };

    // Stats
    const statsRows: any[] = await query(
      `SELECT 
         (SELECT COUNT(*) FROM servicelisting 
          WHERE provider_id = ? AND status = 'active') AS active_services,

         (SELECT COUNT(*) FROM proposal 
          WHERE provider_id = ? AND status = 'submitted') AS open_proposals,

         (SELECT COALESCE(SUM(
              CASE WHEN type = 'credit' THEN credits 
                   WHEN type = 'debit' THEN -credits END
          ), 0) FROM creditledger 
          WHERE provider_id = ?) AS credits_balance
       `,
      [providerId, providerId, providerId]
    );

    const stats = {
      activeServices: statsRows[0]?.active_services ?? 0,
      openProposals: statsRows[0]?.open_proposals ?? 0,
      creditsBalance: statsRows[0]?.credits_balance ?? 0,
    };

    return NextResponse.json({ credits, stats });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch provider data' }, { status: 500 });
  }
}