import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(200).json({
        credits: { total: 0, utilized: 0, balance: 0 },
        stats: { activeServices: 0, openProposals: 0, creditsBalance: 0 },
      });
    }

    // Get user & type
    const sessionRows: any[] = await query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
      return res.status(200).json({
        credits: { total: 0, utilized: 0, balance: 0 },
        stats: { activeServices: 0, openProposals: 0, creditsBalance: 0 },
      });
    }

    const providerId = sessionRows[0].user_id;

    // Credits
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

    return res.status(200).json({ credits, stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch provider data' });
  }
}