// src/app/api/admin/rfp/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { projectId, action } = await req.json();

    if (!projectId || !action) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    let newStatus = '';
    if (action === 'approve') newStatus = 'open';
    else if (action === 'reject') newStatus = 'closed';
    else if (action === 'changes') newStatus = 'in_review';
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    await query(
      `UPDATE projectrequest SET status = ? WHERE project_id = ?`,
      [newStatus, projectId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}