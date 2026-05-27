// src/app/api/provider/submitted-quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ quotes: [] });
    }

    const sessionRows: any[] = await query(
      `SELECT s.user_id 
       FROM sessions s 
       JOIN "user" u ON s.user_id = u.user_id 
       WHERE s.session_token = ? 
         AND s.expires > NOW() 
         AND u.user_type = 'provider'`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ quotes: [] });
    }

    const providerId = sessionRows[0].user_id;

    const quotes: any[] = await query(
      `
      SELECT 
        p.proposal_id,
        p.project_id,
        p.bid_amount,
        p.proposal_message,
        p.status,
        p.credits_used,
        p.created_at AS submitted,
        pr.title AS project_title,
        bp.organization_name AS buyer_name
      FROM proposal p
      JOIN projectrequest pr ON p.project_id = pr.project_id
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE p.provider_id = ?
      ORDER BY p.created_at DESC
      `,
      [providerId]
    );

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch submitted quotes' }, { status: 500 });
  }
}