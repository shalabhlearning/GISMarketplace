import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const getField = (field: any) =>
  Array.isArray(field) ? field[0] : field;

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

    const { user_id: providerId, user_type } = sessionRows[0];

    if (user_type !== 'provider') {
      return res.status(403).json({ error: 'Only providers allowed' });
    }

    const form = formidable({ multiples: true });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const projectId = getField(fields.project_id);
    const bidAmount = parseFloat(getField(fields.bid_amount) || '0');

    const safeParse = (value: any, fallback: any) => {
      try {
        return JSON.parse(getField(value) || JSON.stringify(fallback));
      } catch {
        return fallback;
      }
    };

    const proposalDetails = JSON.stringify({
      technical: getField(fields.technical) || '',
      delivery: getField(fields.delivery) || '',
      milestones: safeParse(fields.milestones, []),
      caseStudies: safeParse(fields.case_studies, []),
      references: safeParse(fields.references, []),
    });

    // FILE UPLOAD
    const attachments: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public/uploads/proposals');
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedFiles = Array.isArray(files.proposal_attachments)
      ? files.proposal_attachments
      : [files.proposal_attachments];

    for (const file of uploadedFiles) {
      if (!file) continue;

      const newFilename = `${Date.now()}-${file.originalFilename}`;
      const newPath = path.join(uploadDir, newFilename);

      await fs.copyFile(file.filepath, newPath);
      attachments.push(`/uploads/proposals/${newFilename}`);
    }

    // INSERT PROPOSAL
    const proposalId = randomUUID();

    await db.query(
      `INSERT INTO proposal 
      (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
      VALUES (?, ?, ?, ?, ?, 'submitted', 20)`,
      [proposalId, projectId, providerId, bidAmount, proposalDetails]
    );

    // ✅ DELETE DRAFT
    await db.query(
      `DELETE FROM proposal_drafts 
       WHERE project_id = ? AND provider_id = ?`,
      [projectId, providerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Quote submitted successfully!',
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit quote' });
  }
}