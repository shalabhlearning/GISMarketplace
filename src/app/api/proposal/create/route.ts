// src/app/api/proposal/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

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

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id: providerId, user_type } = sessionRows[0];
    if (user_type !== 'provider') {
      return NextResponse.json({ error: 'Only providers allowed' }, { status: 403 });
    }

    const formData = await req.formData();

    const projectId = formData.get('project_id') as string;
    const bidAmount = parseFloat(formData.get('bid_amount') as string || '0');

    const proposalDetails = JSON.stringify({
      technical: formData.get('technical') || '',
      delivery: formData.get('delivery') || '',
      milestones: JSON.parse(formData.get('milestones') as string || '[]'),
      caseStudies: JSON.parse(formData.get('case_studies') as string || '[]'),
      references: JSON.parse(formData.get('references') as string || '[]'),
    });

    // File Upload
    const attachments: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public/uploads/proposals');
    await fs.mkdir(uploadDir, { recursive: true });

    const files = formData.getAll('proposal_attachments') as File[];

    for (const file of files) {
      if (!file) continue;
      const newFilename = `${Date.now()}-${file.name}`;
      const newPath = path.join(uploadDir, newFilename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(newPath, buffer);
      attachments.push(`/uploads/proposals/${newFilename}`);
    }

    const proposalId = randomUUID();

    await db.query(
      `INSERT INTO proposal 
      (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
      VALUES (?, ?, ?, ?, ?, 'submitted', 20)`,
      [proposalId, projectId, providerId, bidAmount, proposalDetails]
    );

    // Delete draft
    await db.query(
      `DELETE FROM proposal_drafts 
       WHERE project_id = ? AND provider_id = ?`,
      [projectId, providerId]
    );

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully!',
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }
}