// src/app/api/rfp/list/route.ts   (You can keep this for future use, but we'll use direct queries below for simplicity)
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionResult = await db.query(
      `SELECT u.id AS user_id, u.user_type 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionResult || sessionResult.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id, user_type } = sessionResult[0] as { user_id: string; user_type: string };

    let rfps: any[] = [];

    if (user_type === 'buyer') {
      rfps = await db.query(`
        SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          (SELECT COUNT(*) FROM proposal WHERE project_id = pr.project_id) AS quotes_count
        FROM projectrequest pr
        WHERE pr.buyer_id = ?
        ORDER BY pr.created_at DESC
      `, [user_id]);
    } else if (user_type === 'provider') {
      rfps = await db.query(`
        SELECT 
          pr.project_id,
          pr.title,
          pr.status,
          pr.budget,
          pr.created_at,
          bp.organization_name AS buyer_name
        FROM projectrequest pr
        LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
        WHERE pr.status = 'open' AND pr.visibility = 'public'
        ORDER BY pr.created_at DESC
      `);
    }

    return NextResponse.json({ rfps });
  } catch (err: any) {
    console.error('RFP list API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}