// src/app/api/buyer/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (sessionRows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

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

    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'open' THEN 1 END) as active_rfps,
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) as under_review,
        COUNT(*) as total_rfps
      FROM projectrequest 
      WHERE buyer_id = ?
    `, [buyerId]);

    return NextResponse.json({
      stats: stats[0] || {},
      rfps: rfps || [],
      hasSubscription: true
    });

  } catch (err) {
    console.error('[Buyer Dashboard Error]', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}