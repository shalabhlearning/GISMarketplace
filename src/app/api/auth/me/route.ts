// ─── src/app/api/auth/me/route.ts ────────────────────────────────────────────
// CHANGE: "user" must be quoted in PostgreSQL (reserved word)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ user: null }, { status: 401 });

    const rows = await query(
      `SELECT u.user_id, u.email, u.phone_number, u.user_type
       FROM sessions s
       JOIN "user" u ON u.user_id = s.user_id
       WHERE s.session_token = $1 AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!rows.length) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
