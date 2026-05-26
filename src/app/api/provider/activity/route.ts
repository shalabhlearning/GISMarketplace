// src/app/api/provider/activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ activities: [] });
    }

    // Validate provider session
    const sessionRows: any[] = await query(
      `
      SELECT s.user_id
      FROM sessions s
      JOIN user u ON s.user_id = u.user_id
      WHERE s.session_token = ?
        AND s.expires > NOW()
        AND u.user_type = 'provider'
      `,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ activities: [] });
    }

    const providerId = sessionRows[0].user_id;

    // Safe limit handling
    const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? 20);

    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 50)
      : 20;

    console.log(
      `[Activity] Fetching for provider: ${providerId}, limit: ${limit}`
    );

    // NOTE:
    // LIMIT is injected directly because mysql2 prepared statements
    // sometimes fail with "LIMIT ?" placeholders.
    const sql = `
      WITH activity_data AS (

        -- 1. Quote Submitted
        SELECT
          p.created_at AS sort_ts,
          CONCAT('qs-', p.proposal_id) AS id,
          'quote_sent' AS type,
          'Quote Submitted' AS title,
          CONCAT(
            'You submitted a quote for "',
            COALESCE(pr.title, 'a project'),
            '"'
          ) AS description,
          CONCAT('-', COALESCE(p.credits_used, 20), ' Credits') AS meta,
          'credit' AS meta_kind,
          p.created_at
        FROM proposal p
        JOIN projectrequest pr
          ON p.project_id = pr.project_id
        WHERE p.provider_id = ?

        UNION ALL

        -- 2. Quote Accepted
        SELECT
          p.created_at AS sort_ts,
          CONCAT('qa-', p.proposal_id) AS id,
          'quote_accepted' AS type,
          'Quote Accepted 🎉' AS title,
          CONCAT(
            'Your quote for "',
            COALESCE(pr.title, 'a project'),
            '" was accepted'
          ) AS description,
          CONCAT('$', COALESCE(FORMAT(p.bid_amount, 2), '0.00')) AS meta,
          'money' AS meta_kind,
          p.created_at
        FROM proposal p
        JOIN projectrequest pr
          ON p.project_id = pr.project_id
        WHERE p.provider_id = ?
          AND p.status = 'accepted'

        UNION ALL

        -- 3. Quote Rejected
        SELECT
          p.created_at AS sort_ts,
          CONCAT('qr-', p.proposal_id) AS id,
          'quote_rejected' AS type,
          'Quote Rejected' AS title,
          CONCAT(
            'Your quote for "',
            COALESCE(pr.title, 'a project'),
            '" was not selected'
          ) AS description,
          NULL AS meta,
          NULL AS meta_kind,
          p.created_at
        FROM proposal p
        JOIN projectrequest pr
          ON p.project_id = pr.project_id
        WHERE p.provider_id = ?
          AND p.status = 'rejected'

        UNION ALL

        -- 4. Job Matched
        SELECT
          m.created_at AS sort_ts,
          CONCAT('jm-', m.id) AS id,
          'job_matched' AS type,
          'New Job Match' AS title,
          CONCAT(
            '"',
            COALESCE(pr.title, 'a project'),
            '" matches your skills'
          ) AS description,
          CONCAT(
            COALESCE(ROUND(m.match_score * 100, 0), 0),
            '% match'
          ) AS meta,
          NULL AS meta_kind,
          m.created_at
        FROM rfp_provider_match m
        JOIN projectrequest pr
          ON m.project_id = pr.project_id
        WHERE m.provider_id = ?

        UNION ALL

        -- 5. Credit Added
        SELECT
          cl.created_at AS sort_ts,
          CONCAT('ca-', cl.id) AS id,
          'credit_added' AS type,
          'Credits Added' AS title,
          COALESCE(
            cl.reason,
            'Credits were added to your account'
          ) AS description,
          CONCAT('+', COALESCE(cl.credits, 0), ' Credits') AS meta,
          'credit' AS meta_kind,
          cl.created_at
        FROM creditledger cl
        WHERE cl.provider_id = ?
          AND cl.type = 'credit'

      )

      SELECT *
      FROM activity_data
      ORDER BY sort_ts DESC
      LIMIT ${limit}
    `;

    const params = [
      providerId, // quote submitted
      providerId, // quote accepted
      providerId, // quote rejected
      providerId, // job matched
      providerId, // credit added
    ];

    console.log('[Activity] Params count:', params.length);

    const rows: any[] = await query(sql, params);

    console.log(
      `[Activity] Success - ${rows.length} activities returned`
    );

    const activities = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      meta: r.meta ?? null,
      meta_kind: r.meta_kind ?? null,
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    }));

    return NextResponse.json({ activities });

  } catch (error: any) {
    console.error('❌ Activity Feed Error:', error.message);
    console.error('❌ Error Code:', error.code);
    console.error('❌ SQL State:', error.sqlState);
    console.error('❌ Full Error:', error);

    return NextResponse.json(
      {
        activities: [],
        error: 'Failed to fetch activity feed',
      },
      { status: 500 }
    );
  }
}