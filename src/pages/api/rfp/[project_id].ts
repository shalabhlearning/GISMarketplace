// src/pages/api/rfp/[project_id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { project_id } = req.query;

  if (typeof project_id !== 'string') {
    return res.status(400).json({ error: 'Invalid project_id' });
  }

  try {
    const rows = await query(
      `
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.project_id = ?
      `,
      [project_id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('RFP fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}