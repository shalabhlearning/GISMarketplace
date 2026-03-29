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
    const sessionToken = req.cookies?.session_token;

    console.log('[RFP CREATE] Session token present:', !!sessionToken);

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized – no session token' });
    }

    // Verify session and user type
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

    // Parse multipart form data
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Extract and clean fields
    const title = (fields.title?.[0] || '').trim();
    const description = (fields.description?.[0] || '').trim();
    const budgetStr = fields.budget?.[0] || '';
    const budget = budgetStr ? parseFloat(budgetStr) : null;
    const visibility = (fields.visibility?.[0] || 'public').trim();
    const contactPerson = (fields.contactPerson?.[0] || '').trim();
    const contactEmail = (fields.contactEmail?.[0] || '').trim();

    // Handle dates safely - convert empty string to null
    let startDate = fields.startDate?.[0] ? fields.startDate[0].trim() : null;
    let endDate = fields.endDate?.[0] ? fields.endDate[0].trim() : null;
    let submissionDeadline = fields.submissionDeadline?.[0] 
      ? fields.submissionDeadline[0].trim() 
      : null;

    // Basic validation
    if (!title || !description || !contactPerson || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, contact person, and email are required',
      });
    }

    // Handle file uploads
    const attachments: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public/uploads/proposals');

    await fs.mkdir(uploadDir, { recursive: true });

    const fileArray = Array.isArray(files.attachments) 
      ? files.attachments 
      : files.attachments ? [files.attachments] : [];

    for (const file of fileArray) {
      if (!file || !file.originalFilename) continue;

      const safeName = file.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadDir, filename);

      await fs.copyFile(file.filepath, filePath);
      attachments.push(`/uploads/proposals/${filename}`);
    }

    const projectId = randomUUID();

    // Insert into database
    await db.query(
      `INSERT INTO projectrequest (
        project_id, buyer_id, title, description, budget, status,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, attachments
      ) VALUES (?, ?, ?, ?, ?, 'in_review', ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        buyerId,
        title,
        description,
        budget,
        startDate || null,
        endDate || null,
        submissionDeadline || null,
        visibility,
        contactPerson,
        contactEmail,
        JSON.stringify(attachments),
      ]
    );

    console.log(`[RFP CREATE SUCCESS] Project ID: ${projectId}`);

    return res.status(200).json({
      success: true,
      projectId,
      message: 'RFP created successfully and sent to Admin Review Queue',
    });

  } catch (err: any) {
    console.error('[RFP CREATE ERROR]', err);
    return res.status(500).json({
      error: 'Failed to create RFP',
      details: err.message || 'Unknown error occurred',
    });
  }
}