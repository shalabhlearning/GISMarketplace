// src/app/api/rfp/create/route.ts (Fixed session validation + timezone-safe expires check)
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // 1. Log incoming session token
    const sessionToken = req.cookies.get('session_token')?.value;

    console.log('[RFP CREATE] Session token present:', !!sessionToken);
    if (sessionToken) {
      console.log('[RFP CREATE] Session token (full):', sessionToken);
    }

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized – no session token' }, { status: 401 });
    }

    // 2. FIXED: Use DATE comparison safely (timezone-safe)
    // Also select expires for debug
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

    console.log('[RFP CREATE] Session query returned rows:', sessionRows.length);

    if (sessionRows.length > 0) {
      console.log('[RFP CREATE] Session found → user_id:', sessionRows[0].user_id);
      console.log('[RFP CREATE] Expires:', sessionRows[0].expires);
      console.log('[RFP CREATE] User type:', sessionRows[0].user_type);
    } else {
      // Debug: show recent sessions
      const recent = await db.query(
        'SELECT session_token, user_id, expires FROM sessions ORDER BY expires DESC LIMIT 3'
      );
      console.log('[RFP CREATE] Recent sessions in DB:', recent);
    }

    if (sessionRows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized – invalid or expired session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;
    const userType = sessionRows[0].user_type;

    if (userType !== 'buyer') {
      return NextResponse.json({ error: 'Only buyers can create RFPs' }, { status: 403 });
    }

    // 3. Parse form data
    const formData = await req.formData();

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const budgetRaw = formData.get('budget') as string | null;
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;
    const submissionDeadline = formData.get('submissionDeadline') as string | null;
    const visibility = (formData.get('visibility') as string) || 'public';
    const contactPerson = formData.get('contactPerson') as string | null;
    const contactEmail = formData.get('contactEmail') as string | null;

    if (!title?.trim() || !description?.trim() || !contactPerson?.trim() || !contactEmail?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['title', 'description', 'contactPerson', 'contactEmail'] },
        { status: 400 }
      );
    }

    const budget = budgetRaw && !isNaN(Number(budgetRaw)) ? Number(budgetRaw) : null;

    // 4. Handle attachments
    const attachments: string[] = [];
    const files = formData.getAll('attachments') as File[];

    for (const file of files) {
      if (file.size === 0 || !file.name) continue;
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await fs.writeFile(filePath, buffer);
        attachments.push(`/uploads/${filename}`);
      } catch (fileErr) {
        console.error('[RFP CREATE] File upload failed:', file.name, fileErr);
      }
    }

    // 5. Insert RFP
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
        title.trim(),
        description.trim(),
        budget,
        startDate || null,
        endDate || null,
        submissionDeadline || null,
        visibility,
        contactPerson.trim(),
        contactEmail.trim(),
        JSON.stringify(attachments),
      ]
    );

    return NextResponse.json({
      success: true,
      projectId,
      message: 'RFP created successfully',
      attachmentsCount: attachments.length,
    });
  } catch (err: any) {
    console.error('[RFP CREATE] Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    });

    return NextResponse.json(
      {
        error: 'Failed to create RFP',
        details: err.message,
      },
      { status: 500 }
    );
  }
}