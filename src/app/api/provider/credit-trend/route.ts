// src/app/api/provider/credit-trend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ trend: [] });

    const sessionRows: any[] = await query(
      `SELECT s.user_id 
       FROM sessions s 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) return NextResponse.json({ trend: [] });

    const providerId = sessionRows[0].user_id;

    // ?period=week  → last 8 weeks grouped by week
    // ?period=month → last 6 months grouped by month (default)
    const period = req.nextUrl.searchParams.get('period') ?? 'month';

    let data: any[];

    if (period === 'week') {
      // Group by ISO week for the last 8 weeks
      data = await query(
        `SELECT 
           CONCAT('W', LPAD(WEEK(created_at, 3), 2, '0')) AS m,
           DATE_FORMAT(MIN(created_at), '%d %b')           AS label,
           SUM(credits)                                     AS v
         FROM creditledger
         WHERE provider_id = ?
           AND type        = 'debit'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
         GROUP BY YEARWEEK(created_at, 3)
         ORDER BY YEARWEEK(created_at, 3) ASC`,
        [providerId]
      );
    } else {
      // Group by calendar month for the last 6 months
      data = await query(
        `SELECT 
           DATE_FORMAT(created_at, '%b')    AS m,
           DATE_FORMAT(created_at, '%b %y') AS label,
           SUM(credits)                     AS v
         FROM creditledger
         WHERE provider_id = ?
           AND type        = 'debit'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'),
                  DATE_FORMAT(created_at, '%b'),
                  DATE_FORMAT(created_at, '%b %y')
         ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`,
        [providerId]
      );
    }

    return NextResponse.json({ trend: data ?? [], period });
  } catch (error) {
    console.error('Credit Trend Error:', error);
    return NextResponse.json({ trend: [], period: 'month' });
  }
}