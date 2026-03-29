import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies['session_token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionRows: any[] = await db.query(
      `SELECT s.user_id, u.user_type 
       FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { user_id: providerId } = sessionRows[0];

    const {
      project_id,
      bid_amount,
      technical,
      delivery,
      milestones,
      case_studies,
      references
    } = req.body;

    // ✅ CHECK EXISTING DRAFT
    const existing: any[] = await db.query(
      `SELECT draft_id FROM proposal_drafts 
       WHERE project_id = ? AND provider_id = ?`,
      [project_id, providerId]
    );

    if (existing.length) {
      // 🔁 UPDATE
      await db.query(
        `UPDATE proposal_drafts SET
          bid_amount = ?,
          technical = ?,
          delivery = ?,
          milestones = ?,
          case_studies = ?,
          references_json = ?
        WHERE draft_id = ?`,
        [
          bid_amount || 0,
          technical || '',
          delivery || '',
          JSON.stringify(milestones || []),
          JSON.stringify(case_studies || []),
          JSON.stringify(references || []),
          existing[0].draft_id
        ]
      );

      return res.json({ message: 'Draft updated' });
    }

    // 🆕 CREATE
    const draftId = randomUUID();

    await db.query(
      `INSERT INTO proposal_drafts (
        draft_id,
        project_id,
        provider_id,
        bid_amount,
        technical,
        delivery,
        milestones,
        case_studies,
        references_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draftId,
        project_id,
        providerId,
        bid_amount || 0,
        technical || '',
        delivery || '',
        JSON.stringify(milestones || []),
        JSON.stringify(case_studies || []),
        JSON.stringify(references || [])
      ]
    );

    res.json({ message: 'Draft saved' });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}