import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear cookie
  res.setHeader(
    'Set-Cookie',
    'session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict'
  );

  // Redirect to home page (this is the correct way in Pages Router API routes)
  res.redirect(303, '/');

  // Note: nothing after res.redirect() will execute — that's normal
}