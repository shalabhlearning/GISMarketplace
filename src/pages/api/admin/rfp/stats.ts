import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [approvedResult, topBuyerResult] = await Promise.all([
      query(`
        SELECT COUNT(*) as count 
        FROM projectrequest 
        WHERE status = 'open' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `),
      query(`
        SELECT bp.organization_name as buyer_name, COUNT(*) as count
        FROM projectrequest pr
        JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
        WHERE pr.status IN ('open', 'in_review')
        GROUP BY bp.organization_name
        ORDER BY count DESC
        LIMIT 1
      `)
    ]);

    res.status(200).json({
      approvedThisWeek: approvedResult[0]?.count || 0,
      topBuyer: topBuyerResult[0]?.buyer_name || 'No activity yet'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}