// src/app/api/provider/credit-trend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ trend: [] });

    const sessionRows = await query(
      `SELECT s.user_id
       FROM sessions s
       WHERE s.session_token = $1 AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) return NextResponse.json({ trend: [] });

    const providerId = sessionRows[0].user_id;
    const period = req.nextUrl.searchParams.get('period') ?? 'month';

    let data: any[];

    if (period === 'week') {
      // PostgreSQL: TO_CHAR + date_trunc instead of MySQL WEEK/DATE_FORMAT
      data = await query(
        `SELECT
           TO_CHAR(DATE_TRUNC('week', created_at), 'IYYY-IW') AS m,
           TO_CHAR(MIN(created_at), 'DD Mon')                  AS label,
           SUM(credits)                                         AS v
         FROM creditledger
         WHERE provider_id = $1
           AND type        = 'debit'
           AND created_at >= NOW() - INTERVAL '8 weeks'
         GROUP BY DATE_TRUNC('week', created_at)
         ORDER BY DATE_TRUNC('week', created_at) ASC`,
        [providerId]
      );
    } else {
      // Group by calendar month for the last 6 months
      data = await query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', created_at), 'Mon')    AS m,
           TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS label,
           SUM(credits)                                        AS v
         FROM creditledger
         WHERE provider_id = $1
           AND type        = 'debit'
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at) ASC`,
        [providerId]
      );
    }

    return NextResponse.json({ trend: data ?? [], period });
  } catch (error) {
    console.error('Credit Trend Error:', error);
    return NextResponse.json({ trend: [], period: 'month' });
  }
}
