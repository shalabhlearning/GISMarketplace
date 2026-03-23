// src/pages/api/rfp/single.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { project_id } = req.query;

  if (!project_id || typeof project_id !== 'string') {
    return res.status(400).json({ error: 'project_id is required' });
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

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[api/rfp/single] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}