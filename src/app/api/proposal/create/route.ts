// src/app/api/proposal/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [sessionRows] = await db.query(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > NOW()',
      [sessionToken]
    );
    if (!sessionRows.length) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const providerId = sessionRows[0].user_id;

    const formData = await req.formData();

    const projectId = formData.get('project_id') as string;
    const bidAmount = parseFloat(formData.get('bid_amount') as string || '0');
    const technical = formData.get('technical') as string || '';
    const delivery = formData.get('delivery') as string || '';
    const milestones = JSON.parse((formData.get('milestones') as string) || '[]');
    const caseStudies = JSON.parse((formData.get('case_studies') as string) || '[]');
    const references = JSON.parse((formData.get('references') as string) || '[]');

    const proposalDetails = JSON.stringify({
      technical,
      delivery,
      milestones,
      caseStudies,
      references,
    });

    // Attachments
    const attachments: string[] = [];
    const files = formData.getAll('proposal_attachments') as File[];
    const uploadDir = path.join(process.cwd(), 'public/uploads/proposals');
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      if (file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      attachments.push(`/uploads/proposals/${filename}`);
    }

    const creditsUsed = 500;

    // Check balance
    const [ledger] = await db.query(`
      SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN credits ELSE -credits END), 0) AS balance
      FROM creditledger WHERE provider_id = ?
    `, [providerId]);
    const balance = Number((ledger as any)?.balance || 0);
    if (balance < creditsUsed) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Insert proposal
    const proposalId = randomUUID();
    await db.query(`
      INSERT INTO proposal 
      (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?)
    `, [proposalId, projectId, providerId, bidAmount, proposalDetails + '\nAttachments: ' + JSON.stringify(attachments), creditsUsed]);

    // Debit credits
    await db.query(`
      INSERT INTO creditledger (id, provider_id, credits, type, reason)
      VALUES (?, ?, ?, 'debit', ?)
    `, [randomUUID(), providerId, creditsUsed, `Quote submission for project ${projectId}`]);

    return NextResponse.json({ success: true, message: 'Quote submitted successfully!' });
  } catch (err: any) {
    console.error('Proposal error:', err);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }
}