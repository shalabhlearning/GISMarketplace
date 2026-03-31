// src/app/api/buyer/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ quotes: [] }, { status: 401 });
    }

    const sessionRows: any[] = await query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ quotes: [] }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

    const quotes = await query(
      `
      SELECT 
        p.proposal_id,
        p.project_id,
        p.bid_amount,
        p.proposal_message,
        p.status,
        p.credits_used,
        p.created_at AS submitted,
        pr.title AS rfp_title,
        u.email AS provider_name
      FROM proposal p
      JOIN projectrequest pr ON p.project_id = pr.project_id
      JOIN user u ON p.provider_id = u.user_id
      WHERE pr.buyer_id = ?
      ORDER BY p.created_at DESC
      `,
      [buyerId]
    );

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error('Buyer quotes fetch error:', err);
    return NextResponse.json({ quotes: [] }, { status: 500 });
  }
}