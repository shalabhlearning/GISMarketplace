import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { analyzeRfpWithRAG } from '@/lib/vector-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params;
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows: any[] = await db.query(
      `SELECT u.user_type FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length || sessionRows[0].user_type !== 'provider') {
      return NextResponse.json({ error: 'Only providers can use AI Analyzer' }, { status: 403 });
    }

    const [rfp] = await db.query(
      `SELECT attachments FROM projectrequest WHERE project_id = ?`,
      [project_id]
    );

    if (!rfp?.attachments) {
      return NextResponse.json({ error: 'This RFP has no attachments' }, { status: 400 });
    }

    let attachments: string[] = [];
    try {
      attachments = typeof rfp.attachments === 'string' 
        ? JSON.parse(rfp.attachments) 
        : rfp.attachments;
    } catch (e) {
      console.error("Attachment Parse Error:", e);
      return NextResponse.json({ error: 'Invalid attachment format' }, { status: 400 });
    }

    console.log("📎 Attachments found:", attachments);

    const analysis = await analyzeRfpWithRAG(project_id, attachments);

    return NextResponse.json({
      success: true,
      project_id,
      analysis,
      analyzed_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[AI ANALYZER ERROR]', error);
    return NextResponse.json({ 
      error: 'AI Analysis failed', 
      message: error.message 
    }, { status: 500 });
  }
}