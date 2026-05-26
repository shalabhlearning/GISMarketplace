// src/app/api/buyer/award-quote/route.ts
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
    const { proposal_id, project_id } = await req.json();

    if (!proposal_id || !project_id) {
      return NextResponse.json({ error: 'proposal_id and project_id required' }, { status: 400 });
    }

    // Verify the RFP belongs to this buyer
    const rfpCheck: any[] = await query(
      `SELECT project_id FROM projectrequest WHERE project_id = ? AND buyer_id = ?`,
      [project_id, buyerId]
    );
    if (!rfpCheck.length) return NextResponse.json({ error: 'RFP not found' }, { status: 404 });

    // Verify the proposal belongs to this RFP
    const proposalRows: any[] = await query(
      `SELECT proposal_id FROM proposal WHERE proposal_id = ? AND project_id = ?`,
      [proposal_id, project_id]
    );
    if (!proposalRows.length) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    // Award the selected quote
    await query(
      `UPDATE proposal SET status = 'accepted' WHERE proposal_id = ?`,
      [proposal_id]
    );

    // Auto-reject all other submitted quotes for this RFP
    await query(
      `UPDATE proposal SET status = 'rejected'
       WHERE project_id = ? AND proposal_id != ? AND status = 'submitted'`,
      [project_id, proposal_id]
    );

    // Mark RFP as contracted — skip awarded_to since it's INT but provider_id is UUID char(36)
    // The awarded provider is already tracked via proposal.status = 'accepted'
    await query(
      `UPDATE projectrequest SET status = 'contracted' WHERE project_id = ?`,
      [project_id]
    );

    return NextResponse.json({ success: true, message: 'Contract awarded successfully' });
  } catch (err: any) {
    console.error('[AWARD QUOTE ERROR]', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}