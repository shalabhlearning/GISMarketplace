import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows: any[] = await query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id: buyerId, user_type } = sessionRows[0];

    if (user_type !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can award contracts' }, { status: 403 });
    }

    const { proposal_id } = await req.json();

    if (!proposal_id) {
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Check if buyer owns the project and proposal is submitted
    const proposalRows: any[] = await query(
      `SELECT p.project_id, pr.buyer_id, p.status, pr.start_date, pr.end_date
       FROM proposal p
       JOIN projectrequest pr ON p.project_id = pr.project_id
       WHERE p.proposal_id = ? AND pr.buyer_id = ? AND p.status = 'submitted' AND pr.status = 'open'`,
      [proposal_id, buyerId]
    );

    if (!proposalRows.length) {
      return NextResponse.json({ error: 'Invalid proposal or not authorized' }, { status: 403 });
    }

    const { project_id, start_date, end_date } = proposalRows[0];

    // Create contract
    const contract_id = randomUUID();
    await query(
      `INSERT INTO contract (contract_id, proposal_id, start_date, end_date, status, completion_report)
       VALUES (?, ?, ?, ?, 'in_progress', NULL)`,
      [contract_id, proposal_id, start_date, end_date]
    );

    // Update selected proposal to accepted
    await query(
      `UPDATE proposal SET status = 'accepted' WHERE proposal_id = ?`,
      [proposal_id]
    );

    // Update other proposals to rejected
    await query(
      `UPDATE proposal SET status = 'rejected' WHERE project_id = ? AND proposal_id != ?`,
      [project_id, proposal_id]
    );

    // Update project to contracted, set awarded_to
    await query(
      `UPDATE projectrequest SET status = 'contracted', awarded_to = ? WHERE project_id = ?`,
      [proposal_id, project_id]
    );

    console.log(`Contract awarded: ${contract_id} for proposal ${proposal_id}`);

    return NextResponse.json({ success: true, message: 'Contract awarded successfully', contract_id }, { status: 201 });
  } catch (err: any) {
    console.error('Award contract error:', err);
    return NextResponse.json({ error: 'Failed to award contract', details: err.message }, { status: 500 });
  }
}