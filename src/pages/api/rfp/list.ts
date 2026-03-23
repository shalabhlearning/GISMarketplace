import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies['session_token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionResult: any = await db.query(
      `SELECT u.user_id, u.user_type 
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionResult || sessionResult.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { user_id, user_type } = sessionResult[0];

    let rfps: any[] = [];

    if (user_type === 'buyer') {
      rfps = await db.query(
        `SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          (SELECT COUNT(*) FROM proposal WHERE project_id = pr.project_id) AS quotes_count
        FROM projectrequest pr
        WHERE pr.buyer_id = ?
        ORDER BY pr.created_at DESC`,
        [user_id]
      );
    } else if (user_type === 'provider') {
      rfps = await db.query(
        `SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          bp.organization_name AS buyer_name
        FROM projectrequest pr
        LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
        WHERE pr.status = 'open' AND pr.visibility = 'public'
        ORDER BY pr.created_at DESC`
      );
    }

    return res.status(200).json({ rfps });
  } catch (err: any) {
    console.error('RFP list API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}