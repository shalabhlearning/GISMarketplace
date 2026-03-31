// src/app/api/rfp/[project_id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { project_id: string } }
) {
  const { project_id } = params;

  if (!project_id) {
    return NextResponse.json({ error: 'Invalid project_id' }, { status: 400 });
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
    console.error('RFP fetch error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}