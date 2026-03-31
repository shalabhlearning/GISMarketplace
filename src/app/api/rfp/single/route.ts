// src/app/api/rfp/single/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');

  if (!project_id) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  try {
    const rows = await query(
      `
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.project_id = ?
      `,
      [project_id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('[api/rfp/single] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}