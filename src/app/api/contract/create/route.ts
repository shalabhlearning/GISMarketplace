// src/app/api/contract/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  // Use a fresh sql tag so we can run an explicit transaction
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const { proposal_id } = await req.json();
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and buyer role
    const sessionRows = await sql`
  SELECT s.user_id, u.user_type
  FROM sessions s
  JOIN "user" u ON s.user_id = u.user_id
  WHERE s.session_token = ${sessionToken}
  AND s.expires > NOW()
`;

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id: buyerId, user_type } = sessionRows[0];

    if (user_type !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can award contracts' }, { status: 403 });
    }

    if (!proposal_id) {
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Fetch proposal + project details
    const proposalRows = await sql`
      SELECT
         p.project_id,
         p.status          AS proposal_status,
         p.provider_id     AS freelancer_id,
         pr.status         AS project_status,
         pr.start_date,
         pr.end_date
       FROM proposal p
       JOIN projectrequest pr ON p.project_id = pr.project_id
       WHERE p.proposal_id = ${proposal_id} AND pr.buyer_id = ${buyerId}
    `;

    if (!proposalRows.length) {
      return NextResponse.json({ error: 'Proposal not found or unauthorized' }, { status: 403 });
    }

    const { project_id, freelancer_id, proposal_status, project_status, start_date, end_date } = proposalRows[0];

    if (proposal_status !== 'submitted') {
      return NextResponse.json({ error: 'Proposal already processed' }, { status: 400 });
    }

    if (project_status !== 'open') {
      return NextResponse.json({ error: 'Project already contracted' }, { status: 400 });
    }

    // Check if contract already exists
    const existing = await sql`
      SELECT contract_id FROM contract WHERE proposal_id = ${proposal_id}
    `;

    if (existing.length) {
      return NextResponse.json({ error: 'Contract already exists' }, { status: 400 });
    }

    const contract_id = randomUUID();

    // Run all writes as a transaction using neon's transaction helper
    await sql.transaction([
      sql`
        INSERT INTO contract (contract_id, proposal_id, start_date, end_date, status)
         VALUES (${contract_id}, ${proposal_id}, ${start_date}, ${end_date}, 'in_progress')
      `,
      sql`
        UPDATE proposal SET status = 'accepted' WHERE proposal_id = ${proposal_id}
      `,
      sql`
        UPDATE proposal
         SET status = 'rejected'
         WHERE project_id = ${project_id} AND proposal_id != ${proposal_id}
      `,
      sql`
        UPDATE projectrequest
         SET status = 'contracted', awarded_to = ${freelancer_id}
         WHERE project_id = ${project_id}
      `,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Contract awarded successfully',
      contract_id,
    });

  } catch (err: any) {
    console.error('[Contract Create Error]', err);
    return NextResponse.json({ error: err.message || 'Failed to award contract' }, { status: 500 });
  }
}
