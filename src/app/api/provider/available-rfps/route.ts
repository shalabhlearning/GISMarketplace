// src/app/api/provider/available-rfps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const { searchParams } = new URL(req.url);

    // ✅ Parse and clamp limit — inlined into SQL, never a bind param
    const rawLimit = searchParams.get('limit');
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit), 1), 100) : null;

    let providerId: string | null = null;

    if (sessionToken) {
      const sessionRows = await db.query(
        `SELECT user_id FROM sessions 
         WHERE session_token = ? AND expires > NOW()`,
        [sessionToken]
      );
      providerId = sessionRows[0]?.user_id || null;
    }

    // No logged-in provider → no RFPs. Visibility is strictly checklist-gated,
    // so there is no safe "show everything public" fallback anymore.
    if (!providerId) {
      return NextResponse.json({ success: true, rfps: [] });
    }

    const params: any[] = [];

    let queryStr = `
      SELECT 
        pr.project_id,
        pr.title,
        pr.description,
        pr.status,
        pr.budget,
        pr.start_date,
        pr.end_date,
        pr.submission_deadline,
        pr.contact_person,
        pr.contact_email,
        pr.attachments,
        pr.created_at,
        pr.ai_summary,
        bp.organization_name AS buyer_name,
        COALESCE(rpm.match_score, 0) AS match_score,
        rpm.reason AS match_reason,
        rpm.checklist_added_at
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      INNER JOIN rfp_provider_match rpm
        ON pr.project_id = rpm.project_id
        AND rpm.provider_id = ?
        AND rpm.is_checklist = TRUE
      WHERE pr.status = 'open'
        AND pr.visibility = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM proposal
          WHERE project_id = pr.project_id
            AND provider_id = ?
            AND status = 'submitted'
        )
      ORDER BY rpm.checklist_added_at DESC, match_score DESC, pr.created_at DESC
    `;

    params.push(providerId, providerId);

    // ✅ LIMIT inlined — MySQL prepared statements reject LIMIT as a bind param
    if (limit) {
      queryStr += ` LIMIT ${limit}`;
    }

    const rfps = await db.query(queryStr, params);

    return NextResponse.json({
      success: true,
      rfps: rfps || [],
    });

  } catch (err: any) {
    console.error('[AVAILABLE RFPS ERROR]', err);
    return NextResponse.json({
      success: false,
      rfps: [],
      error: 'Failed to fetch RFPs',
    }, { status: 500 });
  }
}