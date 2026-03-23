import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.session_token;

    let providerId: string | null = null;
    if (sessionToken) {
      const sessionRows: any[] = await query(
        `SELECT s.user_id 
         FROM sessions s 
         WHERE s.session_token = ? AND s.expires > NOW()`,
        [sessionToken]
      );
      providerId = sessionRows[0]?.user_id || null;
    }

    const rfps: any[] = await query(
      `
      SELECT 
        pr.project_id,
        pr.title,
        pr.description,
        pr.status,
        pr.budget,
        pr.start_date,
        pr.end_date,
        pr.submission_deadline,
        pr.contact_person,
        pr.contact_email,
        pr.attachments,
        pr.created_at,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.status = 'open' 
        AND pr.visibility = 'public'
        ${providerId ? `AND NOT EXISTS (
          SELECT 1 FROM proposal 
          WHERE project_id = pr.project_id 
            AND provider_id = ?
        )` : ''}
      ORDER BY pr.created_at DESC
      `,
      providerId ? [providerId] : []
    );

    return res.status(200).json({ rfps });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch available RFPs' });
  }
}