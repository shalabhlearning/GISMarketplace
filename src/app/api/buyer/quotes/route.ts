// src/app/api/buyer/quotes/route.ts
// Now returns RFPs with quote counts (for the landing page cards)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ rfps: [] }, { status: 401 });

    const sessionRows: any[] = await query(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );
    if (!sessionRows.length) return NextResponse.json({ rfps: [] }, { status: 401 });

    const buyerId = sessionRows[0].user_id;

    const rfps = await query(
      `SELECT
        pr.project_id,
        pr.title,
        pr.status,
        pr.budget,
        pr.submission_deadline,
        pr.created_at,
        COUNT(p.proposal_id) AS quotes_count
       FROM projectrequest pr
       LEFT JOIN proposal p ON p.project_id = pr.project_id
       WHERE pr.buyer_id = ?
       GROUP BY pr.project_id
       ORDER BY pr.created_at DESC`,
      [buyerId]
    );

    return NextResponse.json({ rfps });
  } catch (err) {
    console.error('Buyer quotes fetch error:', err);
    return NextResponse.json({ rfps: [] }, { status: 500 });
  }
}