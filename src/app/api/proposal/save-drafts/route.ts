// src/app/api/proposal/save-drafts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT s.user_id FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const providerId = sessionRows[0].user_id;
    const body = await req.json();

    const { 
      project_id, 
      bid_amount = 0, 
      technical = '', 
      delivery = '', 
      milestones = [], 
      case_studies = [], 
      references = [] 
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const existing = await db.query(
      `SELECT draft_id FROM proposal_drafts 
       WHERE project_id = ? AND provider_id = ?`,
      [project_id, providerId]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE proposal_drafts 
         SET bid_amount = ?, technical = ?, delivery = ?, 
             milestones = ?, case_studies = ?, references_json = ?, 
             updated_at = NOW()
         WHERE draft_id = ?`,
        [
          bid_amount,
          technical,
          delivery,
          JSON.stringify(milestones),
          JSON.stringify(case_studies),
          JSON.stringify(references),
          existing[0].draft_id
        ]
      );
      return NextResponse.json({ message: 'Draft updated successfully' });
    }

    const draftId = randomUUID();

    await db.query(
      `INSERT INTO proposal_drafts 
       (draft_id, project_id, provider_id, bid_amount, technical, delivery, 
        milestones, case_studies, references_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draftId,
        project_id,
        providerId,
        bid_amount,
        technical,
        delivery,
        JSON.stringify(milestones),
        JSON.stringify(case_studies),
        JSON.stringify(references)
      ]
    );

    return NextResponse.json({ message: 'Draft saved successfully' });

  } catch (err: any) {
    console.error('Save Draft Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save draft' }, { status: 500 });
  }
}