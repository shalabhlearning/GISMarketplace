// src/app/api/rfp/save-draft/route.ts
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
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length || sessionRows[0].user_type !== 'buyer') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;
    const body = await req.json();

    const {
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

    // Check existing draft
    const existing: any[] = await db.query(
      `SELECT draft_id FROM rfp_drafts WHERE buyer_id = ? LIMIT 1`,
      [buyerId]
    );

    if (existing.length) {
      await db.query(
        `UPDATE rfp_drafts SET
          title = ?,
          description = ?,
          budget = ?,
          currency = ?,
          start_date = ?,
          end_date = ?,
          submission_deadline = ?,
          visibility = ?,
          contact_person = ?,
          contact_email = ?,
          credits = ?
        WHERE draft_id = ?`,
        [
          title || '',
          description || '',
          budget || 0,
          currency || 'USD',
          startDate || null,
          endDate || null,
          submissionDeadline || null,
          visibility || 'public',
          contactPerson || '',
          contactEmail || '',
          credits || 0,
          existing[0].draft_id
        ]
      );

      return NextResponse.json({ message: 'Draft updated' });
    }

    // Create new draft
    const draftId = randomUUID();

    await db.query(
      `INSERT INTO rfp_drafts (
        draft_id, buyer_id, title, description, budget, currency,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, credits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draftId,
        buyerId,
        title || '',
        description || '',
        budget || 0,
        currency || 'USD',
        startDate || null,
        endDate || null,
        submissionDeadline || null,
        visibility || 'public',
        contactPerson || '',
        contactEmail || '',
        credits || 0
      ]
    );

    return NextResponse.json({ message: 'Draft saved' });

  } catch (err: any) {
    console.error("💥 SAVE DRAFT ERROR:", err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}