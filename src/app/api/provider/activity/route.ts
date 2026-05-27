// src/app/api/provider/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ activities: [] });

    const sessionRows = await query(
      `SELECT s.user_id
       FROM sessions s
       JOIN "user" u ON s.user_id = u.user_id
       WHERE s.session_token = $1
         AND s.expires > NOW()
         AND u.user_type = 'provider'`,
      [sessionToken]
    );

    if (!sessionRows.length) return NextResponse.json({ activities: [] });

    const providerId = sessionRows[0].user_id;

    const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;

    // PostgreSQL: || for string concat, TO_CHAR for formatting, no FORMAT()
    const sql = `
      WITH activity_data AS (

        SELECT
          p.created_at                                  AS sort_ts,
          'qs-' || p.proposal_id                        AS id,
          'quote_sent'                                  AS type,
          'Quote Submitted'                             AS title,
          'You submitted a quote for "' ||
            COALESCE(pr.title, 'a project') || '"'      AS description,
          '-' || COALESCE(p.credits_used, 20)::text
            || ' Credits'                               AS meta,
          'credit'                                      AS meta_kind,
          p.created_at
        FROM proposal p
        JOIN projectrequest pr ON p.project_id = pr.project_id
        WHERE p.provider_id = $1

        UNION ALL

        SELECT
          p.created_at,
          'qa-' || p.proposal_id,
          'quote_accepted',
          'Quote Accepted 🎉',
          'Your quote for "' ||
            COALESCE(pr.title, 'a project') || '" was accepted',
          '$' || TO_CHAR(COALESCE(p.bid_amount, 0), 'FM999999990.00'),
          'money',
          p.created_at
        FROM proposal p
        JOIN projectrequest pr ON p.project_id = pr.project_id
        WHERE p.provider_id = $2 AND p.status = 'accepted'

        UNION ALL

        SELECT
          p.created_at,
          'qr-' || p.proposal_id,
          'quote_rejected',
          'Quote Rejected',
          'Your quote for "' ||
            COALESCE(pr.title, 'a project') || '" was not selected',
          NULL,
          NULL,
          p.created_at
        FROM proposal p
        JOIN projectrequest pr ON p.project_id = pr.project_id
        WHERE p.provider_id = $3 AND p.status = 'rejected'

        UNION ALL

        SELECT
          m.created_at,
          'jm-' || m.id,
          'job_matched',
          'New Job Match',
          '"' || COALESCE(pr.title, 'a project') || '" matches your skills',
          COALESCE(ROUND(m.match_score * 100), 0)::text || '% match',
          NULL,
          m.created_at
        FROM rfp_provider_match m
        JOIN projectrequest pr ON m.project_id = pr.project_id
        WHERE m.provider_id = $4

        UNION ALL

        SELECT
          cl.created_at,
          'ca-' || cl.id,
          'credit_added',
          'Credits Added',
          COALESCE(cl.reason, 'Credits were added to your account'),
          '+' || COALESCE(cl.credits, 0)::text || ' Credits',
          'credit',
          cl.created_at
        FROM creditledger cl
        WHERE cl.provider_id = $5 AND cl.type = 'credit'

      )
      SELECT * FROM activity_data
      ORDER BY sort_ts DESC
      LIMIT ${limit}
    `;

    const rows = await query(sql, [providerId, providerId, providerId, providerId, providerId]);

    const activities = rows.map((r: any) => ({
      id:          r.id,
      type:        r.type,
      title:       r.title,
      description: r.description,
      meta:        r.meta ?? null,
      meta_kind:   r.meta_kind ?? null,
      created_at:  r.created_at instanceof Date
                     ? r.created_at.toISOString()
                     : String(r.created_at),
    }));

    return NextResponse.json({ activities });

  } catch (error: any) {
    console.error('❌ Activity Feed Error:', error.message);
    return NextResponse.json({ activities: [], error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
