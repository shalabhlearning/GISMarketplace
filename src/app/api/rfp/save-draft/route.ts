// src/app/api/rfp/save-draft/route.ts
// Supports multiple named drafts per buyer.
// Pass draft_id in body to UPDATE an existing draft; omit to CREATE a new one.
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows: any[] = await db.query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s
       JOIN "user" u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length || sessionRows[0].user_type !== 'buyer') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;
    const body = await req.json();

    const {
      draft_id,           // optional — if provided, update that draft
      title,
      description,
      budget,
      currency,
      startDate,
      endDate,
      submissionDeadline,
      visibility,
      contactPerson,
      contactEmail,
      credits,
    } = body;

    const fields = [
      title             || '',
      description       || '',
      budget            || 0,
      currency          || 'USD',
      startDate         || null,
      endDate           || null,
      submissionDeadline|| null,
      visibility        || 'public',
      contactPerson     || '',
      contactEmail      || '',
      credits           || 0,
    ];

    if (draft_id) {
      // Update existing draft — verify ownership
      const existing: any[] = await db.query(
        `SELECT draft_id FROM rfp_drafts WHERE draft_id = ? AND buyer_id = ?`,
        [draft_id, buyerId]
      );

      if (!existing.length) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      await db.query(
        `UPDATE rfp_drafts SET
          title = ?, description = ?, budget = ?, currency = ?,
          start_date = ?, end_date = ?, submission_deadline = ?,
          visibility = ?, contact_person = ?, contact_email = ?, credits = ?,
          updated_at = NOW()
        WHERE draft_id = ? AND buyer_id = ?`,
        [...fields, draft_id, buyerId]
      );

      return NextResponse.json({ success: true, draft_id, message: 'Draft updated' });
    }

    // Create a brand-new draft
    const newDraftId = randomUUID();

    await db.query(
      `INSERT INTO rfp_drafts (
        draft_id, buyer_id, title, description, budget, currency,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, credits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newDraftId, buyerId, ...fields]
    );

    return NextResponse.json({ success: true, draft_id: newDraftId, message: 'Draft saved' });

  } catch (err: any) {
    console.error('[SAVE DRAFT ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}