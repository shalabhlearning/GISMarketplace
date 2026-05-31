// src/app/api/rfp/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Verify session token ─────────────────────────────────────────
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized – no session token' },
        { status: 401 }
      );
    }

    // ── Step 2: Validate session and check buyer role ─────────────────────────
    const sessionRows: any[] = await db.query(
      `SELECT s.user_id, u.user_type
       FROM sessions s
       JOIN "user" u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (sessionRows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized – invalid or expired session' },
        { status: 401 }
      );
    }

    const buyerId  = sessionRows[0].user_id;
    const userType = sessionRows[0].user_type;

    if (userType !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can create RFPs' },
        { status: 403 }
      );
    }

    // ── Step 3: Parse form fields ─────────────────────────────────────────────
    const formData = await req.formData();

    const title               = (formData.get('title')               as string || '').trim();
    const description         = (formData.get('description')         as string || '').trim();
    const budgetStr           =  formData.get('budget')              as string;
    const budget              = budgetStr ? parseFloat(budgetStr) : null;
    const currency            = (formData.get('currency')            as string || 'USD').trim();
    const visibility          = (formData.get('visibility')          as string || 'public').trim();
    const contactPerson       = (formData.get('contactPerson')       as string || '').trim();
    const contactEmail        = (formData.get('contactEmail')        as string || '').trim();
    const startDate           =  formData.get('startDate')           as string || null;
    const endDate             =  formData.get('endDate')             as string || null;
    const submissionDeadline  =  formData.get('submissionDeadline')  as string || null;

    // ── Step 4: Validate required fields ─────────────────────────────────────
    if (!title || !description || !contactPerson || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, contact person, and email are required' },
        { status: 400 }
      );
    }

    // ── Step 5: Upload attachments to Vercel Blob ─────────────────────────────
    const attachments: string[] = [];
    const files = formData.getAll('attachments') as File[];

    for (const file of files) {
      if (!file || !file.size) continue;

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `proposals/${Date.now()}-${safeName}`;

      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      });

      attachments.push(blob.url); // full https://... URL stored in DB
    }

    // ── Step 6: Insert RFP into database ──────────────────────────────────────
    const projectId = randomUUID();

    await db.query(
      `INSERT INTO projectrequest (
        project_id, buyer_id, title, description, budget, currency, status,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, 'in_review', ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        buyerId,
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
        JSON.stringify(attachments),
      ]
    );

    // ── Step 7: Return success ────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      projectId,
      message: 'RFP created successfully and sent to Admin Review Queue',
    });

  } catch (err: any) {
    console.error('[RFP CREATE ERROR]', err);
    return NextResponse.json(
      {
        error: 'Failed to create RFP',
        details: err.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}