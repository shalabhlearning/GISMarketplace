import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies['session_token'];

    if (!sessionToken) {
      return res.status(401).json({ user: null });
    }

    const rows: any = await query(
      `
      SELECT u.user_id, u.email, u.phone_number, u.user_type
      FROM sessions s
      JOIN user u ON u.user_id = s.user_id
      WHERE s.session_token = ? AND s.expires > NOW()
      `,
      [sessionToken]
    );

    if (!rows.length) {
      return res.status(401).json({ user: null });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Auth failed' });
  }
}