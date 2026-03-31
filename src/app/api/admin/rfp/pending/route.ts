// src/app/api/admin/rfp/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const rows = await query(`
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.status = 'in_review'
      ORDER BY pr.created_at DESC
    `);

    return NextResponse.json({ rfps: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch pending RFPs' }, { status: 500 });
  }
}