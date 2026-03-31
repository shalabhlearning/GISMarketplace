// src/app/api/rfp/get-drafts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows: any[] = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

    const drafts: any[] = await db.query(
      `SELECT * FROM rfp_drafts 
       WHERE buyer_id = ? 
       ORDER BY created_at DESC`,
      [buyerId]
    );

    return NextResponse.json(drafts);
  } catch (err) {
    console.error("💥 GET DRAFTS ERROR:", err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}