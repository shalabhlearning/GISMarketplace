// src/app/api/buyer/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (sessionRows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

    const rfps = await db.query(`
      SELECT 
        pr.project_id,
        pr.title,
        pr.description,
        pr.budget,
        pr.status,
        pr.created_at,
        pr.submission_deadline,
        pr.start_date,
        pr.end_date,
        pr.contact_person,
        pr.contact_email,
        pr.attachments,
        (
          SELECT COUNT(*) 
          FROM proposal p 
          WHERE p.project_id = pr.project_id 
            AND p.status = 'submitted'
        ) AS quotes_count
      FROM projectrequest pr
      WHERE pr.buyer_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 10
    `, [buyerId]);

    const stats = await db.query(`
      SELECT 
        -- Total RFPs created by this buyer (all statuses)
        COUNT(*) AS total_rfps_created,

        -- RFPs that are open or have been awarded (approved/live)
        COUNT(CASE WHEN status IN ('open', 'awarded') THEN 1 END) AS approved_rfps,

        -- RFPs currently under admin review
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) AS under_review,

        -- Total quotes received across ALL this buyer's RFPs
        (
          SELECT COUNT(*)
          FROM proposal p
          JOIN projectrequest pr2 ON p.project_id = pr2.project_id
          WHERE pr2.buyer_id = ?
        ) AS total_quotes_received

      FROM projectrequest 
      WHERE buyer_id = ?
    `, [buyerId, buyerId]);

    return NextResponse.json({
      stats: stats[0] || {},
      rfps: rfps || [],
      hasSubscription: true
    });

  } catch (err) {
    console.error('[Buyer Dashboard Error]', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}