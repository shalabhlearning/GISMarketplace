import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const rows: any = await query(
      `
      SELECT u.user_id, u.email, u.user_type
      FROM sessions s
      JOIN user u ON u.user_id = s.user_id
      WHERE s.session_token = ? AND s.expires > NOW()
      `,
      [sessionToken]
    );

    if (!rows.length) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
