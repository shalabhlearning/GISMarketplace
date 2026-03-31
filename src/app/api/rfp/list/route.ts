// src/app/api/rfp/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionResult: any[] = await db.query(
      `SELECT u.user_id, u.user_type 
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionResult.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id, user_type } = sessionResult[0];
    let rfps: any[] = [];

    if (user_type === 'buyer') {
      rfps = await db.query(
        `SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          (SELECT COUNT(*) FROM proposal WHERE project_id = pr.project_id) AS quotes_count
        FROM projectrequest pr
        WHERE pr.buyer_id = ?
        ORDER BY pr.created_at DESC`,
        [user_id]
      );
    } else if (user_type === 'provider') {
      rfps = await db.query(
        `SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          bp.organization_name AS buyer_name
        FROM projectrequest pr
        LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
        WHERE pr.status = 'open' AND pr.visibility = 'public'
        ORDER BY pr.created_at DESC`
      );
    }

    return NextResponse.json({ rfps });
  } catch (err: any) {
    console.error('RFP list API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}