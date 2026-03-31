// src/app/api/provider/available-rfps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    let providerId: string | null = null;

    if (sessionToken) {
      const sessionRows: any[] = await query(
        `SELECT s.user_id 
         FROM sessions s 
         WHERE s.session_token = ? AND s.expires > NOW()`,
        [sessionToken]
      );
      providerId = sessionRows[0]?.user_id || null;
    }

    const rfps: any[] = await query(
      `
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
        bp.organization_name AS buyer_name
      FROM projectrequest pr
      LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
      WHERE pr.status = 'open' 
        AND pr.visibility = 'public'
        ${providerId ? `AND NOT EXISTS (
          SELECT 1 FROM proposal 
          WHERE project_id = pr.project_id 
            AND provider_id = ?
            AND status = 'submitted'
        )` : ''}
      ORDER BY pr.created_at DESC
      `,
      providerId ? [providerId] : []
    );

    return NextResponse.json({ rfps });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch available RFPs' }, { status: 500 });
  }
}