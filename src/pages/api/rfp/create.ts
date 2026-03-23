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

    console.log('[RFP CREATE] Session token present:', !!sessionToken);

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized – no session token' });
    }

    const sessionRows: any[] = await db.query(
      `SELECT 
         s.user_id,
         s.expires,
         u.user_type
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ?
         AND s.expires > NOW()`,
      [sessionToken]
    );

    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized – invalid or expired session' });
    }

    const buyerId = sessionRows[0].user_id;
    const userType = sessionRows[0].user_type;

    if (userType !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can create RFPs' });
    }

    // Parse form-data using formidable
    const form = formidable({ multiples: true });

    const { fields, files }: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const title = fields.title;
    const description = fields.description;
    const budget = fields.budget ? Number(fields.budget) : null;
    const startDate = fields.startDate || null;
    const endDate = fields.endDate || null;
    const submissionDeadline = fields.submissionDeadline || null;
    const visibility = fields.visibility || 'public';
    const contactPerson = fields.contactPerson;
    const contactEmail = fields.contactEmail;

    if (!title || !description || !contactPerson || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Handle file uploads
    const attachments: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedFiles = Array.isArray(files.attachments)
      ? files.attachments
      : [files.attachments];

    for (const file of uploadedFiles) {
      if (!file) continue;

      const safeName = file.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadDir, filename);

      await fs.copyFile(file.filepath, filePath);
      attachments.push(`/uploads/${filename}`);
    }

    const projectId = randomUUID();

    await db.query(
      `INSERT INTO projectrequest (
        project_id, buyer_id, title, description, budget, status,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, attachments
      ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        buyerId,
        title,
        description,
        budget,
        startDate,
        endDate,
        submissionDeadline,
        visibility,
        contactPerson,
        contactEmail,
        JSON.stringify(attachments),
      ]
    );

    return res.status(200).json({
      success: true,
      projectId,
      message: 'RFP created successfully',
    });
  } catch (err: any) {
    console.error('[RFP CREATE ERROR]', err);
    return res.status(500).json({
      error: 'Failed to create RFP',
      details: err.message,
    });
  }
}