import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current buyer
    const sessionRows = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const buyerId = sessionRows[0].user_id;

    // Get buyer's RFPs (most recent first)
    const rfps = await db.query(`
      SELECT 
        project_id,
        title,
        description,
        budget,
        status,
        created_at,
        submission_deadline,
        attachments
      FROM projectrequest 
      WHERE buyer_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [buyerId]);

    // Get basic stats (you can expand this)
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'open' THEN 1 END) as active_rfps,
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) as under_review,
        COUNT(*) as total_rfps
      FROM projectrequest 
      WHERE buyer_id = ?
    `, [buyerId]);

    res.status(200).json({
      stats: stats[0] || {},
      rfps: rfps || [],
      hasSubscription: true // Update this logic based on your buyerprofile.subscription_status
    });

  } catch (err) {
    console.error('[Buyer Dashboard Error]', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
}