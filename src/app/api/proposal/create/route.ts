// src/app/api/proposal/create/route.ts (Credit system temporarily disabled)
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    console.log('╔════════════════════════════════════════════╗');
    console.log('║ PROPOSAL CREATE REQUEST RECEIVED          ║');
    console.log('╟────────────────────────────────────────────╢');
    console.log('║ Cookie "session_token" present? ', !!sessionToken ? 'YES' : 'NO');
    console.log('║ Token value (first 10 chars): ', sessionToken ? sessionToken.slice(0, 10) + '...' : 'none');
    console.log('╚════════════════════════════════════════════╝');

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

    console.log('Found session rows:', sessionRows.length);

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id: providerId, user_type } = sessionRows[0];

    if (user_type !== 'provider') {
      return NextResponse.json({ error: 'Only providers can submit quotes' }, { status: 403 });
    }

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

    // Attachments handling
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

    // CREDIT SYSTEM DISABLED FOR NOW
    // No balance check
    // No debit entry
    // credits_used = 0 in proposal

    // Insert proposal (credits_used = 0)
    const proposalId = randomUUID();
    await db.query(`
      INSERT INTO proposal 
      (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
      VALUES (?, ?, ?, ?, ?, 'submitted', 0)
    `, [proposalId, projectId, providerId, bidAmount, proposalDetails + '\nAttachments: ' + JSON.stringify(attachments)]);

    return NextResponse.json({ success: true, message: 'Quote submitted successfully!' });
  } catch (err: any) {
    console.error('Proposal error:', err);
    return NextResponse.json({ error: 'Failed to submit quote', details: err.message }, { status: 500 });
  }
}