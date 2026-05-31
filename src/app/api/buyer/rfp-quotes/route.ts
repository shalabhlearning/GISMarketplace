// src/app/api/buyer/rfp-quotes/route.ts  (NEW FILE)
// Returns all quotes for a specific RFP belonging to this buyer
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ quotes: [] }, { status: 401 });

    const sessionRows: any[] = await query(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );
    if (!sessionRows.length) return NextResponse.json({ quotes: [] }, { status: 401 });

    const buyerId = sessionRows[0].user_id;

    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get('project_id');
    if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

    // Verify this RFP belongs to the buyer
    const rfpCheck: any[] = await query(
      `SELECT project_id FROM projectrequest WHERE project_id = ? AND buyer_id = ?`,
      [project_id, buyerId]
    );
    if (!rfpCheck.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const quotes = await query(
      `SELECT
        p.proposal_id,
        p.project_id,
        p.bid_amount,
        p.proposal_message,
        p.status,
        p.credits_used,
        p.created_at AS submitted,
        u.email       AS provider_email,
        COALESCE(pp.organization_name, u.email) AS provider_name
       FROM proposal p
       JOIN "user" u ON p.provider_id = u.user_id
       LEFT JOIN providerprofile pp ON pp.provider_id = p.provider_id
       WHERE p.project_id = ?
       ORDER BY p.bid_amount ASC`,
      [project_id]
    );

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error('RFP quotes fetch error:', err);
    return NextResponse.json({ quotes: [] }, { status: 500 });
  }
}