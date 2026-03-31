// src/app/api/proposal/get-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    if (!sessionToken || !projectId) {
      return NextResponse.json(null);
    }

    const sessionRows: any[] = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json(null);
    }

    const providerId = sessionRows[0].user_id;

    const rows: any[] = await db.query(
      `SELECT * FROM proposal_drafts 
       WHERE BINARY project_id = BINARY ? 
       AND provider_id = ? 
       LIMIT 1`,
      [String(projectId), String(providerId)]
    );

    if (!rows.length) {
      return NextResponse.json(null);
    }

    const d = rows[0];

    const safeParse = (value: any) => {
      try {
        if (!value) return [];
        if (typeof value === 'string') return JSON.parse(value);
        return value;
      } catch {
        return [];
      }
    };

    return NextResponse.json({
      bid_amount: d.bid_amount || '',
      technical: d.technical || '',
      delivery: d.delivery || '',
      milestones: safeParse(d.milestones),
      case_studies: safeParse(d.case_studies),
      references: safeParse(d.references_json)
    });

  } catch (err) {
    console.error("GET DRAFT ERROR:", err);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }
}