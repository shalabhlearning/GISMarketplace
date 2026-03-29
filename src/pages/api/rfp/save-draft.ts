import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ GET BUYER
    const sessionRows: any[] = await db.query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    console.log("🟡 SESSION:", sessionRows);

    if (!sessionRows.length || sessionRows[0].user_type !== 'buyer') {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const buyerId = sessionRows[0].user_id;

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
    } = req.body;

    console.log("🔵 SAVE DRAFT BODY:", req.body);

    // ✅ CHECK EXISTING
    const existing: any[] = await db.query(
      `SELECT draft_id FROM rfp_drafts WHERE buyer_id = ? LIMIT 1`,
      [buyerId]
    );

    if (existing.length) {
      // 🔁 UPDATE
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

      return res.json({ message: 'Draft updated' });
    }

    // 🆕 CREATE
    const draftId = randomUUID();

    await db.query(
      `INSERT INTO rfp_drafts (
        draft_id,
        buyer_id,
        title,
        description,
        budget,
        currency,
        start_date,
        end_date,
        submission_deadline,
        visibility,
        contact_person,
        contact_email,
        credits
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

    res.json({ message: 'Draft saved' });

  } catch (err: any) {
    console.error("💥 SAVE DRAFT ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
}