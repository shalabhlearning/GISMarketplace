// src/app/api/provider/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    let providerId: string | null = null;

    if (sessionToken) {
      const sessionRows = await query(
        `SELECT user_id FROM sessions 
         WHERE session_token = ? AND expires > NOW()`,
        [sessionToken]
      );
      providerId = sessionRows[0]?.user_id || null;
    }

    const rfps = await query(
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
      LIMIT 4
      `,
      providerId ? [providerId] : []
    );

    console.log(`Dashboard API - Found ${rfps.length} RFPs (after filtering submitted)`);

    let hasSubscription = true;

    return NextResponse.json({ 
      rfps: rfps || [], 
      hasSubscription 
    });

  } catch (err: any) {
    console.error('Dashboard API Error:', err.message);
    return NextResponse.json({ 
      rfps: [], 
      hasSubscription: false,
      error: err.message 
    });
  }
}