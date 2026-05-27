// src/app/api/rfp/[project_id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }   // ← Important for Next.js 15+
) {
  try {
    const { project_id } = await params;   // ← Await params (newer Next.js)

    console.log("📌 Received Project ID:", project_id);

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const rows = await query(
      `
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.project_id = ?
      LIMIT 1
      `,
      [project_id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    return NextResponse.json({ rfp: rows[0] });

  } catch (err: any) {
    console.error('❌ RFP API Error:', err.message);
    return NextResponse.json({ 
      error: 'Failed to load project',
      message: err.message 
    }, { status: 500 });
  }
}