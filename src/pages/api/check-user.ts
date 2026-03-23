import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, phoneNumber } = req.body;

    if (!email || !phoneNumber) {
      return res.status(400).json({
        error: 'Email and phone number are required',
      });
    }

    const rows: any = await query(
      `SELECT user_id FROM user WHERE email = ? OR phone_number = ?`,
      [email.trim(), phoneNumber.trim()]
    );

    if (rows.length > 0) {
      return res.status(409).json({
        exists: true,
        error: 'User with this email or phone already exists',
      });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('CHECK USER ERROR:', error);
    return res.status(500).json({
      error: 'Server error while checking user',
    });
  }
}