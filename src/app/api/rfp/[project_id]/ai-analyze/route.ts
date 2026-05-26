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

    // Auth check - Only providers
    const [session] = await db.query(
      `SELECT u.user_type FROM sessions s 
       JOIN user u ON s.user_id = u.user_id 
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!session || session.user_type !== 'provider') {
      return NextResponse.json({ error: 'Only providers can use AI Analyzer' }, { status: 403 });
    }

    // Get RFP attachments
    const [rfp] = await db.query(
      `SELECT attachments FROM projectrequest WHERE project_id = ?`,
      [project_id]
    );

    if (!rfp?.attachments) {
      return NextResponse.json({ error: 'No attachments found' }, { status: 400 });
    }

    let attachments: string[] = [];
    try {
      attachments = typeof rfp.attachments === 'string' 
        ? JSON.parse(rfp.attachments) 
        : rfp.attachments;
    } catch {
      return NextResponse.json({ error: 'Invalid attachment data' }, { status: 400 });
    }

    // Run AI Analysis
    const analysis = await analyzeRfpWithRAG(project_id, attachments);

    // === SAVE TO DATABASE ===
    await db.query(
      `UPDATE projectrequest 
       SET ai_summary = ?, 
           ai_processed = TRUE, 
           ai_processed_at = NOW() 
       WHERE project_id = ?`,
      [JSON.stringify(analysis), project_id]
    );

    console.log(`💾 AI Analysis saved successfully for RFP: ${project_id}`);

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