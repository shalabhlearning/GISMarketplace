// src/app/api/admin/rfp/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const [pendingResult, approvedResult, rejectedResult, topBuyerResult] = await Promise.all([
      // Total Pending
      query(`
        SELECT COUNT(*) as count 
        FROM projectrequest 
        WHERE status = 'in_review'
      `),

      // Total Approved (All time)
      query(`
        SELECT COUNT(*) as count 
        FROM projectrequest 
        WHERE status = 'open'
      `),

      // Total Rejected (All time)
      query(`
        SELECT COUNT(*) as count 
        FROM projectrequest 
        WHERE status = 'closed'
      `),

      // Top Buyer
      query(`
        SELECT bp.organization_name as buyer_name, COUNT(*) as count
        FROM projectrequest pr
        JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
        WHERE pr.status IN ('open', 'in_review')
        GROUP BY bp.organization_name
        ORDER BY count DESC
        LIMIT 1
      `)
    ]);

    return NextResponse.json({
      totalPending: pendingResult[0]?.count || 0,
      totalApproved: approvedResult[0]?.count || 0,
      totalRejected: rejectedResult[0]?.count || 0,
      topBuyer: topBuyerResult[0]?.buyer_name || 'No activity yet'
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}