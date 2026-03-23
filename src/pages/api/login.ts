import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Identifier (email or phone) and password are required',
      });
    }

    const trimmedIdentifier = identifier.trim();

    const users: any[] = await query(
      'SELECT user_id, password_hash, user_type FROM user WHERE (email = ? OR phone_number = ?) AND status = "active"',
      [trimmedIdentifier, trimmedIdentifier]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Delete old sessions
    await query('DELETE FROM sessions WHERE user_id = ?', [user.user_id]);

    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (session_token, user_id, expires) VALUES (?, ?, ?)',
      [sessionToken, user.user_id, expires]
    );

    // ✅ Set cookie (Pages Router way)
    res.setHeader(
      'Set-Cookie',
      `session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    await query('UPDATE user SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        userId: user.user_id,
        identifier: trimmedIdentifier,
        userType: user.user_type,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}