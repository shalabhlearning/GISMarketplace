// app/api/rfp/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // Session check
    const sessionToken = req.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized – no session' }, { status: 401 });
    }

    const [sessionRows]: any = await db.query(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > NOW()',
      [sessionToken]
    );

    if (!sessionRows || sessionRows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized – invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

    // Parse form data
    const formData = await req.formData();

    const title              = formData.get('title') as string;
    const description        = formData.get('description') as string;
    const budgetRaw          = formData.get('budget') as string;
    const budget             = budgetRaw && !isNaN(parseFloat(budgetRaw)) ? parseFloat(budgetRaw) : null;
    const startDate          = (formData.get('startDate') as string) || null;
    const endDate            = (formData.get('endDate') as string) || null;
    const submissionDeadline = (formData.get('submissionDeadline') as string) || null;
    const visibility         = (formData.get('visibility') as string) || 'public';
    const contactPerson      = formData.get('contactPerson') as string;
    const contactEmail       = formData.get('contactEmail') as string;

    // Updated validation – removed category
    if (!title || !description || !contactPerson || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, contact person, contact email' },
        { status: 400 }
      );
    }

    // Handle attachments
    const attachments: string[] = [];
    const files = formData.getAll('attachments') as File[];

    for (const file of files) {
      if (file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(process.cwd(), 'public/uploads', filename);
      await fs.writeFile(filePath, buffer);
      attachments.push(`/uploads/${filename}`);
    }

    const projectId = randomUUID();

    // INSERT – no category_id column anymore
    await db.query(
      `INSERT INTO projectrequest (
        project_id, buyer_id, title, description, budget, status,
        start_date, end_date, submission_deadline, visibility,
        contact_person, contact_email, attachments, created_at
      ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, NOW())`,
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

    return NextResponse.json({
      success: true,
      projectId,
      message: 'RFP created successfully'
    });

  } catch (err: any) {
    console.error('Create RFP error:', err);
    return NextResponse.json(
      { error: 'Failed to create RFP', details: err?.message || 'Database error' },
      { status: 500 }
    );
  }
}