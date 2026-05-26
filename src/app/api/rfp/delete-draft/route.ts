// src/app/api/rfp/delete-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows: any[] = await db.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const buyerId = sessionRows[0].user_id;

    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('draft_id');

    if (!draftId) {
      return NextResponse.json({ error: 'draft_id is required' }, { status: 400 });
    }

    // Only allow deleting own drafts
    const result: any = await db.query(
      `DELETE FROM rfp_drafts WHERE draft_id = ? AND buyer_id = ?`,
      [draftId, buyerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Draft not found or not yours' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Draft deleted' });

  } catch (err: any) {
    console.error('[DELETE DRAFT ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}