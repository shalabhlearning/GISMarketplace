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
      return res.status(403).json({ error: 'Only providers can submit quotes' });
    }

    const form = formidable({ multiples: true });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const projectId = fields.project_id;
    const bidAmount = parseFloat(fields.bid_amount || '0');

    const proposalDetails = JSON.stringify({
      technical: fields.technical || '',
      delivery: fields.delivery || '',
      milestones: JSON.parse(fields.milestones || '[]'),
      caseStudies: JSON.parse(fields.case_studies || '[]'),
      references: JSON.parse(fields.references || '[]'),
    });

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

    const creditRows: any[] = await db.query(
      `SELECT COALESCE(SUM(CASE 
         WHEN type = 'credit' THEN credits 
         WHEN type = 'debit' THEN -credits 
       END), 0) AS total_credits
       FROM creditledger 
       WHERE provider_id = ?`,
      [providerId]
    );

    const total_credits = creditRows[0]?.total_credits || 0;

    if (total_credits < 20) {
      return res.status(403).json({
        error: 'Insufficient credits. Need at least 20 credits.',
      });
    }

    const proposalId = randomUUID();

    await db.query(
      `INSERT INTO proposal 
      (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
      VALUES (?, ?, ?, ?, ?, 'submitted', 20)`,
      [proposalId, projectId, providerId, bidAmount, proposalDetails]
    );

    await db.query(
      `INSERT INTO creditledger (id, provider_id, credits, type, reason) 
       VALUES (?, ?, 20, 'debit', 'Proposal submission')`,
      [randomUUID(), providerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Quote submitted successfully!',
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      error: 'Failed to submit quote',
      details: err.message,
    });
  }
}