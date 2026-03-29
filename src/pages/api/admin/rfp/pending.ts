import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rows = await query(`
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.status = 'in_review'
      ORDER BY pr.created_at DESC
    `);

    res.status(200).json({ rfps: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending RFPs' });
  }
}