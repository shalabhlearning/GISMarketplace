// src/app/api/buyer/reject-quote/route.ts  (NEW FILE)
// Rejects a single quote
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionRows: any[] = await query(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );
    if (!sessionRows.length) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const buyerId = sessionRows[0].user_id;
    const { proposal_id } = await req.json();

    if (!proposal_id) return NextResponse.json({ error: 'proposal_id required' }, { status: 400 });

    // Verify buyer owns the RFP this proposal belongs to
    const check: any[] = await query(
      `SELECT p.proposal_id FROM proposal p
       JOIN projectrequest pr ON p.project_id = pr.project_id
       WHERE p.proposal_id = ? AND pr.buyer_id = ?`,
      [proposal_id, buyerId]
    );
    if (!check.length) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    await query(
      `UPDATE proposal SET status = 'rejected' WHERE proposal_id = ?`,
      [proposal_id]
    );

    return NextResponse.json({ success: true, message: 'Quote rejected' });
  } catch (err: any) {
    console.error('[REJECT QUOTE ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}