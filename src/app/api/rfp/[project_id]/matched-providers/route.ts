// src/app/api/rfp/[project_id]/matched-providers/route.ts
//
// GET  → returns all providers matched to this RFP (used by admin ReviewPanel)
// POST → manually triggers re-matching for this RFP (replaces old match-providers route)
//
// The old /api/rfp/[project_id]/match-providers route is deleted — use this instead.

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { matchProvidersForRfp } from '@/lib/matchProviders';

// ─── GET: read existing matches ───────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params;

    const providers = await query(
      `SELECT 
         rpm.provider_id,
         rpm.match_score,
         rpm.reason,
         pp.organization_name
       FROM rfp_provider_match rpm
       JOIN providerprofile pp ON rpm.provider_id = pp.provider_id
       WHERE rpm.project_id = ?
       ORDER BY rpm.match_score DESC`,
      [project_id]
    );

    return NextResponse.json({ success: true, providers: providers || [] });

  } catch (err: any) {
    console.error('[MATCHED PROVIDERS GET ERROR]', err);
    return NextResponse.json(
      { success: false, providers: [], error: err.message },
      { status: 500 }
    );
  }
}

// ─── POST: trigger re-matching for this RFP ───────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params;

    // Verify RFP exists and is open
    const [rfp] = await query(
      `SELECT status, ai_skills FROM projectrequest WHERE project_id = ?`,
      [project_id]
    );

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }
    if (rfp.status !== 'open') {
      return NextResponse.json({ error: 'RFP is not open' }, { status: 400 });
    }
    if (!rfp.ai_skills) {
      return NextResponse.json(
        { error: 'Skills not extracted yet — approve the RFP first' },
        { status: 400 }
      );
    }

    const result = await matchProvidersForRfp(project_id);

    return NextResponse.json({
      success: result.success,
      project_id,
      total_matches: result.total_matches,
      error: result.error,
    });

  } catch (err: any) {
    console.error('[MATCHED PROVIDERS POST ERROR]', err);
    return NextResponse.json(
      { error: 'Matching failed', message: err.message },
      { status: 500 }
    );
  }
}