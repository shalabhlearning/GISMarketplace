// src/app/api/admin/rfp/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'all' | 'in_review' | 'open' | 'closed'

    let whereClause = '';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE pr.status = ?';
      params.push(status);
    }

    const rows = await query(`
      SELECT 
        pr.*,
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      ${whereClause}
      ORDER BY pr.created_at DESC
    `, params);

    return NextResponse.json({ rfps: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch RFPs' }, { status: 500 });
  }
}