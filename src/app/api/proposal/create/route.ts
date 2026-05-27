// src/app/api/proposal/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import { debitProviderCredits } from '@/lib/providerCredits';

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Proposal Create Route HIT Successfully!");

    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT s.user_id, u.user_type FROM sessions s 
       JOIN "user" u ON s.user_id = u.user_id 
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

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if project exists
    const projectCheck = await db.query(
      "SELECT project_id FROM projectrequest WHERE project_id = ?", 
      [projectId]
    );
    if (projectCheck.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Prevent duplicate submission
    const existingProposal = await db.query(
      `SELECT proposal_id FROM proposal 
       WHERE project_id = ? AND provider_id = ? AND status = 'submitted'`,
      [projectId, providerId]
    );

    if (existingProposal.length > 0) {
      return NextResponse.json({ 
        error: 'You have already submitted a proposal for this project.' 
      }, { status: 409 });
    }

    const proposalDetails = JSON.stringify({
      technical: formData.get('technical') || '',
      delivery: formData.get('delivery') || '',
      milestones: JSON.parse((formData.get('milestones') as string) || '[]'),
      caseStudies: JSON.parse((formData.get('case_studies') as string) || '[]'),
      references: JSON.parse((formData.get('references') as string) || '[]'),
    });

    const proposalId = randomUUID();

    // Insert Proposal
    await db.query(
      `INSERT INTO proposal 
       (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used)
       VALUES (?, ?, ?, ?, ?, 'submitted', 20)`,
      [proposalId, projectId, providerId, bidAmount, proposalDetails]
    );

    // Deduct 20 Credits
    await debitProviderCredits(
      providerId, 
      20, 
      `Proposal submission for project ${projectId}`
    );

    console.log(`✅ Quote Submitted! Proposal ID: ${proposalId} | 20 credits deducted`);

    return NextResponse.json({ 
      success: true, 
      message: 'Quote submitted successfully!',
      proposal_id: proposalId 
    });

  } catch (err: any) {
    console.error('Submit Quote Error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to submit quote' }, { status: 500 });
  }
}