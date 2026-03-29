import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ GET USER
    const sessionRows: any[] = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const buyerId = sessionRows[0].user_id;

    // ✅ GET ALL DRAFTS
    const drafts: any[] = await db.query(
      `SELECT * FROM rfp_drafts 
       WHERE buyer_id = ? 
       ORDER BY created_at DESC`,
      [buyerId]
    );

    return res.json(drafts);

  } catch (err) {
    console.error("💥 GET DRAFTS ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
}